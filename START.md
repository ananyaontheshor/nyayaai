# NyayaAI — Quick Start

## 1. Add your API key

Edit `.env` and set your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-...
```
Get one at https://console.anthropic.com/

## 2. Start the app

```bash
# Terminal 1 — backend (Express + Anthropic AI)
npm run dev:server

# Terminal 2 — frontend (Vite React)
npm run dev:ui
```

Or run both together:
```bash
npm run dev
```

## 3. Open the app

Go to: http://localhost:5173

## Features

| Feature | Description |
|---|---|
| Case Law Search | Search 4.8 lakh+ Indian judgments (SC + High Courts) |
| Judgment Analyser | AI-powered ratio decidendi extraction, section correlation |
| Multi-Agent Compliance | 4 parallel agents check legislation, case law, regulations |
| Article Correlator | Cross-reference acts & sections with judicial interpretation |

## Data Sources

- **IN/SCJudgments** — Supreme Court (2021–2026)
- **IN/HighCourtAWS** — All High Courts (2025–2026)
- **IN/SEBI** — SEBI orders & circulars (1993–2026)
- **IN/RBI** — RBI notifications (1978–2026)
- **IN/IndiaCode** — 225+ Central Acts
- **IN/eGazette** — Official Gazette
- **IN/TRAI** — TRAI regulations
