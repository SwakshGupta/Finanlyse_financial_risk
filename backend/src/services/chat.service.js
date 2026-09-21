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
  async sendMessage(applicationId, user, { message, history = [], mode }) {
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

    // 2. Build role-aware system instruction with full grounding
    const lowerMsg = (message || '').toLowerCase();
    const queryHintsAnalyst = lowerMsg.includes('as analyst') || lowerMsg.includes('as underwriter') || lowerMsg.includes('underwriter review');
    const isAnalyst = (mode === 'ANALYST') || (user?.role?.toUpperCase() === 'ANALYST' && mode !== 'APPLICANT') || queryHintsAnalyst;

    let roleDirective = '';
    if (isAnalyst) {
      roleDirective = `CRITICAL IDENTITY DIRECTIVE - INSTITUTIONAL CREDIT ANALYST:
You are speaking directly with a CREDIT ANALYST / UNDERWRITER reviewing the loan file.
The interlocutor is NOT the applicant. The applicant's name is ${applicantName}.
- ADDRESS THE INTERLOCUTOR STRICTLY AS: "Analyst" or "Underwriter". NEVER greet them as "${applicantName}".
- TONE REQUIREMENT: Direct, objective, concise, and blunt underwriting evaluation.
- DO NOT provide gentle borrower coaching, encouragement, or personal finance tips (do NOT say "Here are gentle steps to improve your savings", "I am glad to assist you with your journey", etc.).
- FOCUS EXCLUSIVELY ON: Underwriting risk metrics, debt serviceability, cash-flow coverage ratios (DTI, surplus), balance volatility, default probability drivers, and conditional structuring or mitigants.`;
    } else {
      roleDirective = `CRITICAL IDENTITY DIRECTIVE - BORROWER / APPLICANT (${applicantName}):
You are speaking directly with the BORROWER / APPLICANT (${applicantName}).
- ADDRESS THE INTERLOCUTOR RESPECTFULLY AS: ${applicantName}.
- TONE REQUIREMENT: Gentle, encouraging, empathetic, and constructive at all times.
- DO NOT provide cold, blunt, harsh bureaucratic rejection language.
- Reassure the borrower that alternative scoring evaluates real cash-flow discipline rather than penalizing them for lacking traditional bureau history.
- Provide clear, supportive, and achievable financial coaching steps to strengthen their cash surplus and credit resilience.`;
    }

    const systemInstruction = `You are the Finalyse AI Credit Risk Assistant, an enterprise underwriting and financial inclusion intelligence engine.

${roleDirective}

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
1. Adhere strictly to the persona tone indicated in CRITICAL IDENTITY DIRECTIVE above.
2. If interlocutor is an Analyst, give concise, quantitative, blunt bullet points on debt serviceability, surplus buffer, and leverage.
3. If interlocutor is an Applicant, explain factors clearly and gently with practical, positive guidance.
4. You CANNOT change, recalculate, or override the numerical score. Never make legally binding loan promises.
5. Format your response cleanly with markdown.`;

    // 3. Format conversational history for LLM
    const speakerLabel = isAnalyst ? 'Credit Analyst' : applicantName;
    let formattedPrompt = `${speakerLabel}: ${message.trim()}`;
    if (history && history.length > 0) {
      // Filter out greetings that misrepresent the current interlocutor
      const recentHistory = history
        .slice(-6)
        .filter((h) => !(isAnalyst && h.content?.includes('analyzed your alternative risk assessment')));
      if (recentHistory.length > 0) {
        const conversationContext = recentHistory
          .map((h) => `${h.role === 'user' ? speakerLabel : 'Finalyse Assistant'}: ${h.content}`)
          .join('\n');
        formattedPrompt = `Previous conversation:\n${conversationContext}\n\n${speakerLabel}: ${message.trim()}`;
      }
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
        replyText = this._generateMockChatReply(message, { score, riskBand, summary, isAnalyst, applicantName });
      }

      if (!replyText || !replyText.trim()) {
        throw new Error('LLM returned empty reply');
      }
    } catch (err) {
      console.warn(`[ChatService] Provider (${provider.providerName}) chat error: ${err.message}. Using fallback.`);
      fallbackUsed = true;
      replyText = this._generateFallbackChatReply(message, { score, riskBand, defaultProb, summary, isAnalyst, applicantName });
    }

    return {
      reply: replyText.trim(),
      provider: fallbackUsed ? 'fallback' : provider.providerName,
      model: fallbackUsed ? 'deterministic-fallback-v1' : provider.modelName,
      timestamp: new Date().toISOString(),
      fallbackUsed,
    };
  }

  _generateMockChatReply(message, { score, riskBand, summary, isAnalyst, applicantName }) {
    const q = message.toLowerCase();
    const greeting = isAnalyst
      ? `Underwriter Briefing [File: ${applicantName}]:`
      : `Hello ${applicantName}, I am glad to assist you with your credit journey!`;

    if (q.includes('improve') || q.includes('better') || q.includes('steps') || q.includes('recommendation') || q.includes('levers')) {
      if (isAnalyst) {
        return `${greeting}\n\n**Underwriting Risk Levers & Covenants:**\n1. **Leverage Ceiling**: Restrict aggregate debt commitments to <=35% DTI.\n2. **Liquidity Cushion**: Require minimum average daily balance maintaining >=₹${Math.round((summary?.monthlyExpenses || 20000) * 0.5).toLocaleString('en-IN')}.\n3. **Cash-Flow Stability**: 3-month rolling surplus volatility must remain below 25%.`;
      }
      return `${greeting}\n\nHere are 3 gentle, positive steps you can take to strengthen your profile:\n\n1. **Build a Monthly Buffer**: Try to preserve around 15–20% of your earnings after monthly expenses to demonstrate resilience.\n2. **Manage Debt Commitments**: Keeping loan or EMI installments under 35% of income helps maintain comfortable breathing room.\n3. **Maintain Steady Daily Balances**: Keeping a modest buffer in your account between pay cycles shows steady financial discipline.`;
    }

    if (q.includes('score') || q.includes('calculated') || q.includes('how was')) {
      if (isAnalyst) {
        return `${greeting}\n\n* **Risk Metric**: Score ${score}/100 | Risk Band: ${riskBand}\n* **Cash Flow Coverage**: Monthly Surplus ₹${Math.round(summary?.cashFlowSurplus || 0).toLocaleString('en-IN')}\n* **Leverage Ratio**: DTI ${((summary?.debtToIncome || 0) * 100).toFixed(1)}%\n* **Underwriting Assessment**: ${score >= 70 ? 'Acceptable serviceability under standard covenant.' : 'Elevated risk profile; requires collateral or guarantor mitigant.'}`;
      }
      return `${greeting}\n\nThe **Alternative Risk Score is ${score}/100 (${riskBand} Risk)**. It was evaluated from 6 months of verifiable banking and digital cash flows, featuring a net monthly surplus of **₹${Math.round(summary?.cashFlowSurplus || 0).toLocaleString('en-IN')}** and a Debt-to-Income (DTI) ratio of **${((summary?.debtToIncome || 0) * 100).toFixed(1)}%**.`;
    }
    if (isAnalyst) {
      return `${greeting}\n\nUnderwriting summary for **${applicantName}**:\n* **Score**: ${score}/100 (${riskBand})\n* **Monthly Surplus**: ₹${Math.round(summary?.cashFlowSurplus || 0).toLocaleString('en-IN')}\n* **DTI Ratio**: ${((summary?.debtToIncome || 0) * 100).toFixed(1)}%\nDirect query prompt received. State specific underwriting verification or parameter inquiry.`;
    }
    return `${greeting}\n\nBased on the current evaluation with an Alternative Risk Score of **${score}/100 (${riskBand})**, your profile reflects active digital transactions and positive cash management.`;
  }

  _generateFallbackChatReply(message, { score, riskBand, defaultProb, summary, isAnalyst, applicantName }) {
    const q = message.toLowerCase();
    const greeting = isAnalyst
      ? `Underwriting Audit Note [Applicant: ${applicantName}]:`
      : `Hello ${applicantName}, here are some helpful insights:`;

    if (isAnalyst) {
      return `${greeting}\n\n* **Score**: ${score}/100 (${riskBand} Risk)\n* **Est. Default Prob**: ${defaultProb}%\n* **Monthly Surplus**: ₹${Math.round(summary?.cashFlowSurplus || 0).toLocaleString('en-IN')}\n* **DTI**: ${((summary?.debtToIncome || 0) * 100).toFixed(1)}%\n* **Evaluation**: Direct risk assessment. Unmitigated thin file requires strict cash-flow monitoring.`;
    }

    if (q.includes('improve') || q.includes('increase') || q.includes('steps')) {
      return `${greeting}\n\n* **Maintain Higher Surplus**: Preserve more than ₹${Math.round((summary?.cashFlowSurplus || 10000) * 1.2).toLocaleString('en-IN')} monthly.\n* **Control Debt Burden**: Keep debt obligations under 35% DTI.\n* **Consistent Inflows**: Maintain regular recurring transaction frequency.`;
    }
    return `${greeting}\n\nThe assessment established an **Alternative Risk Score of ${score}/100 (${riskBand} Risk)** based on verified cash flows with a monthly surplus of **₹${Math.round(summary?.cashFlowSurplus || 0).toLocaleString('en-IN')}**.`;
  }
}

module.exports = new ChatService();
