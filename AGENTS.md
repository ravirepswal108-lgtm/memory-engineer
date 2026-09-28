# AGENTS.md — Memory Engineer Architecture & Guidelines

## Overview
**Memory Engineer** is an AI Engineering Incident Intelligence Agent built for the **AI Agents That Learn Using Hindsight** hackathon.
It assists reliability engineers and equipment operators by analyzing engineering incidents using historical failure memory from **Hindsight Cloud** and high-speed LLM reasoning from **Groq**.

## Key Architecture & Directory Structure
```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── incident-analysis/route.ts  # Memory recall -> Groq reasoning -> Hindsight retain
│   │   │   └── incident-outcome/route.ts   # Post-repair outcome retention in Hindsight
│   │   ├── layout.tsx
│   │   ├── page.tsx                        # Incident intelligence dashboard UI
│   │   └── globals.css
│   ├── lib/
│   │   └── config.ts                      # Secure server-side environment key validation
│   ├── services/
│   │   ├── hindsight.ts                   # @vectorize-io/hindsight-client wrapper (retain, recall)
│   │   ├── groq.ts                        # groq-sdk integration (llama-3.3-70b-versatile)
│   │   └── incident.ts                    # Core pipeline orchestration logic
│   └── types/
│       └── incident.ts                    # Incident interfaces & validateIncidentInput schema
├── tests/
│   └── incident.test.ts                   # Unit & integration test suite
├── .env.example                           # Example environment variable template
├── README.md                              # Complete setup & API documentation
└── AGENTS.md                              # Agent architecture rules & guidelines
```

## Security & Architectural Rules
1. **API Key Isolation**:
   - `HINDSIGHT_API_KEY`, `HINDSIGHT_BANK_ID`, and `GROQ_API_KEY` must **NEVER** be exposed to the browser or prefixed with `NEXT_PUBLIC_`.
   - Access API clients exclusively from server components, server actions, or API route handlers.
2. **Hindsight Integration**:
   - Use official `@vectorize-io/hindsight-client`.
   - Operations: `recall(bankId, query)` and `retain(bankId, content, options)`.
3. **Groq Integration**:
   - Use `groq-sdk` with `llama-3.3-70b-versatile` and structured JSON response mode.
