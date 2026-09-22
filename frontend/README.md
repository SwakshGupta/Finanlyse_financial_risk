# Frontend — AI-Powered Financial Inclusion Dashboard

The frontend application provides the user interface for applicants and risk analysts to submit financial data, view dynamic risk assessments, examine grounded AI explanations, and experiment with what-if credit scenarios.

---

## 1. Overview & Core Features

Built with **React 18** and **Vite** with a custom Vanilla CSS design system (dark obsidian canvas, glassmorphic surfaces, HSL color tokens):
- **Role-Aware Authentication**: Dual-mode login and registration (`APPLICANT` vs `ANALYST`) with 1-click demo persona quick-fills.
- **Application Intake Wizard**: 3-step intake collecting applicant details, fair-lending consent, and financial data via 1-click synthetic presets, manual inputs, or statement CSV uploads.
- **Risk Assessment Dashboard**:
  - Alternative Risk Score SVG circular arc gauge (0–100 scaled)
  - Estimated Default Probability and Risk Band pills (`LOW`, `MODERATE`, `HIGH`)
  - Feature-level positive/negative risk drivers with signed contribution bars
  - 24-Month Temporal Inflow trajectory chart (`IncomeTrendCard.jsx`)
  - Longitudinal behavioral indicators (3M momentum, deficit months, liquidity floor)
  - Grounded AI explanation card with live regeneration controls
- **Interactive What-If Scenario Lab**: Real-time counterfactual sliders for income, expenses, debt EMI, and cash buffers to preview score adjustments without altering immutable baseline records.
- **Conversational Credit Advisor**: Role-aware credit assistant drawer adapting its tone to Underwriter or Applicant perspectives.

---

## 2. Local Development

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000`. The Vite server automatically proxies `/api` and `/health` requests to the backend on port 4000.

### Production Build Verification
```bash
npm run build
```
Generates production-optimized static bundle in `frontend/dist/`.

---

## 3. AWS Amplify Hosting Deployment

The frontend is deployed to **AWS Amplify Hosting** via repository build specification `amplify.yml`:
- **Build Commands**:
  - `preBuild`: `npm --prefix frontend ci`
  - `build`: `npm --prefix frontend run build`
  - `artifacts.baseDirectory`: `frontend/dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: Browser-safe public URL of the backend Application Load Balancer (e.g. `https://api.finalyse.yourdomain.com`).
- **Security Check**:
  - **NEVER** expose `GEMINI_API_KEY`, `JWT_SECRET`, database passwords, or AWS credentials to the frontend environment or Vite build arguments. Only browser-safe variables starting with `VITE_` are permitted.
