# Data Management — AI-Powered Financial Inclusion

This directory manages canonical datasets, synthetic benchmark profiles, and data processing artifacts.

---

## 1. Directory Layout

```text
data/
├── raw/            # Sample raw statement files or uploaded CSVs (gitignored)
├── processed/      # Normalized canonical financial records ready for feature extraction
├── synthetic/      # Generated synthetic applicant profiles for baseline model training
└── README.md
```

---

## 2. Privacy & Data Ethics Policy

- **No Real Customer PII**: Real customer Personally Identifiable Information (PII) must never be committed to this repository.
- **Synthetic Datasets**: For prototype training and experimentation, all applicant profiles are synthetically generated using clear, documented distributions.
- **Data Minimization**: Only consented financial data necessary for risk estimation (income, balances, obligations, transaction regularity) is captured.
- **No Invasive Permissions**: No contact lists, SMS scrapers, or private browsing telemetry are permitted.
