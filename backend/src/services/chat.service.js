const applicationRepository = require('../repositories/application.repository');
const assessmentRepository = require('../repositories/assessment.repository');
const financialRepository = require('../repositories/financial.repository');
const LLMFactory = require('../integrations/llm/llm.factory');
const { deriveFinancialSummary } = require('../modules/financial/canonical.schema');
const {
  ValidationError,
  ForbiddenError,
  NotFoundError,
} = require('../utils/errors');

class ChatService {
  /**
   * Process a conversational question regarding an application's assessment
   */
  async sendMessage(applicationId, user, { message, history = [] }) {
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new ValidationError('Message string is required');
    }

    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new NotFoundError(`Application '${applicationId}' not found`);
    }

    if (user.role === 'APPLICANT' && app.userId !== user.id) {
      throw new ForbiddenError('Unauthorized to chat regarding this application');
    }

    const assessment = await assessmentRepository.getLatestByApplicationId(applicationId);
    if (!assessment) {
      throw new ValidationError(`Cannot chat regarding unassessed application '${applicationId}'. Please run risk assessment first.`);
    }

    // 1. Gather context
    const finProfile = await financialRepository.getFinancialProfile(applicationId);
    const transactions = await financialRepository.getTransactions(applicationId);
    const summary = finProfile ? deriveFinancialSummary(finProfile, transactions) : {};

    let factors = assessment.factors;
    if ((!factors || (!factors.positive?.length && !factors.negative?.length)) && assessment.raw_factors) {
      factors = typeof assessment.raw_factors === 'string' ? JSON.parse(assessment.raw_factors) : assessment.raw_factors;
    }

    const score = assessment.score ?? assessment.riskScore ?? 50;
    const defaultProb = ((assessment.default_probability ?? assessment.defaultProbability ?? 0.15) * 100).toFixed(1);
    const riskBand = assessment.risk_band ?? assessment.riskBand ?? 'MODERATE';
    const applicantName = app.applicant?.fullName || 'Applicant';

    // 2. Build system instruction with full grounding
    const systemInstruction = `You are the Finalyse AI Credit Risk Assistant, an empathetic, transparent, and rigorous financial inclusion advisor.
You are conversing with or on behalf of ${applicantName} about their alternative credit assessment.

FACTUAL UNDERWRITING CONTEXT (STRICTLY GROUNDED):
- Applicant Name: ${applicantName}
- Alternative Risk Score: ${score}/100 (${riskBand} Risk)
- Estimated Default Probability: ${defaultProb}%
- Monthly Income: ₹${Math.round(summary?.monthlyIncome || 0).toLocaleString('en-IN')}
- Monthly Expenses: ₹${Math.round(summary?.monthlyExpenses || 0).toLocaleString('en-IN')}
- Committed Monthly Debt (EMI): ₹${Math.round(summary?.monthlyEmi || 0).toLocaleString('en-IN')}
- Net Monthly Cash Flow Surplus: ₹${Math.round(summary?.cashFlowSurplus || 0).toLocaleString('en-IN')}
- Debt-to-Income (DTI) Ratio: ${((summary?.debtToIncome || 0) * 100).toFixed(1)}%
- Savings Rate: ${((summary?.savingsRate || 0) * 100).toFixed(1)}%
- Average Daily Balance: ₹${Math.round(summary?.averageBalance || 0).toLocaleString('en-IN')}
- Positive Model Drivers: ${(factors?.positive || []).map((f) => f.description || f.impact || f.featureName).join('; ') || 'Positive cash flow stability'}
- Risk Factors: ${(factors?.negative || []).map((f) => f.description || f.impact || f.featureName).join('; ') || 'Limited transaction history'}
- Observation Period: 6 months of alternative banking/UPI cash-flow data (no traditional credit bureau scores used).

CONVERSATION GUIDELINES:
1. Explain factors clearly using simple, respectful language without bureaucratic jargon.
2. If asked how to improve their score, provide 2-3 concrete, actionable cash-flow recommendations (e.g. maintaining at least 15-20% cash surplus, reducing debt commitments below 35% DTI, keeping consistent daily account balances).
3. Be encouraging of financial inclusion: explain that alternative scoring empowers thin-file and gig-economy borrowers who lack traditional credit cards or loans.
4. You CANNOT change, recalculate, or override the numerical score. Never make binding loan commitments.
5. Format your response cleanly with markdown (bold key metrics, use bullet points for suggestions).`;

    // 3. Format conversational history for LLM
    let formattedPrompt = `User question: ${message.trim()}`;
    if (history && history.length > 0) {
      const recentHistory = history.slice(-6); // Keep last 3 turns
      const conversationContext = recentHistory
        .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
        .join('\n');
      formattedPrompt = `Previous conversation:\n${conversationContext}\n\nUser question: ${message.trim()}`;
    }

    const provider = LLMFactory.getProvider();
    let replyText = '';
    let fallbackUsed = false;

    try {
      if (provider.providerName === 'gemini') {
        const res = await provider.generateText({
          prompt: formattedPrompt,
          systemInstruction,
          temperature: 0.3,
        });
        replyText = res.text;
      } else {
        // MockProvider or offline mode
        replyText = this._generateMockChatReply(message, { score, riskBand, summary, factors });
      }

      if (!replyText || !replyText.trim()) {
        throw new Error('LLM returned empty reply');
      }
    } catch (err) {
      console.warn(`[ChatService] Provider (${provider.providerName}) chat error: ${err.message}. Using fallback.`);
      fallbackUsed = true;
      replyText = this._generateFallbackChatReply(message, { score, riskBand, defaultProb, summary, factors });
    }

    return {
      reply: replyText.trim(),
      provider: fallbackUsed ? 'fallback' : provider.providerName,
      model: fallbackUsed ? 'deterministic-fallback-v1' : provider.modelName,
      timestamp: new Date().toISOString(),
      fallbackUsed,
    };
  }

  _generateMockChatReply(message, { score, riskBand, summary }) {
    const q = message.toLowerCase();
    if (q.includes('score') || q.includes('calculated')) {
      return `Your **Alternative Risk Score is ${score}/100 (${riskBand} Risk)**. It was calculated using machine learning based on your alternative cash flow patterns over 6 months, specifically your monthly surplus of **₹${Math.round(summary?.cashFlowSurplus || 0).toLocaleString('en-IN')}** and a Debt-to-Income (DTI) ratio of **${((summary?.debtToIncome || 0) * 100).toFixed(1)}%**.`;
    }
    if (q.includes('improve') || q.includes('better')) {
      return `Here are 3 key ways to improve your alternative score:\n\n1. **Increase Cash Surplus**: Aim to maintain at least 20% of your earnings after expenses.\n2. **Lower Debt Commitments**: Keep debt installments (EMI) below 35% of monthly income.\n3. **Maintain Steady Balances**: Avoid letting account balances dip to near-zero between inflow cycles.`;
    }
    return `Based on your profile with a **${score}/100 (${riskBand})** score, your financial activity demonstrates active digital engagement. Maintaining a positive surplus of ₹${Math.round(summary?.cashFlowSurplus || 0).toLocaleString('en-IN')} provides strong repayment capacity.`;
  }

  _generateFallbackChatReply(message, { score, riskBand, summary }) {
    const q = message.toLowerCase();
    if (q.includes('improve') || q.includes('increase') || q.includes('steps')) {
      return `To improve your score beyond **${score}/100**:\n\n* **Maintain Higher Surplus**: Preserve more than ₹${Math.round((summary?.cashFlowSurplus || 10000) * 1.2).toLocaleString('en-IN')} monthly.\n* **Control Debt Burden**: Keep your DTI under 35%.\n* **Consistent Inflows**: Ensure regular deposits across platforms.`;
    }
    return `Your evaluation established an **Alternative Risk Score of ${score}/100 (${riskBand} Risk)** based on verified cash flows with a monthly surplus of **₹${Math.round(summary?.cashFlowSurplus || 0).toLocaleString('en-IN')}**.`;
  }
}

module.exports = new ChatService();
