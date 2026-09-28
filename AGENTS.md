# AGENTS.md — Memory Engineer Architecture & Guidelines

## Overview
**Memory Engineer** is an AI Engineering Incident Intelligence Agent built for the **AI Agents That Learn Using Hindsight** hackathon.
It assists reliability engineers and equipment operators by analyzing engineering incidents using historical failure memory from **Hindsight Cloud** and high-speed LLM reasoning from **Groq**.

## Key Architecture & Directory Structure
```
├── src/
│   ├── app/                    # Next.js App Router (UI components & pages)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── lib/                    # Core configuration utilities
│   │   └── config.ts           # Server-side environment key validation & security
│   ├── services/               # Server-side domain services
│   │   ├── hindsight.ts        # Hindsight Cloud client wrapper (@vectorize-io/hindsight-client)
│   │   ├── groq.ts             # Groq API client integration (groq-sdk)
│   │   └── incident.ts         # End-to-end incident intelligence workflow
│   └── types/                  # Domain type definitions
│       └── incident.ts         # Incident, Memory, Analysis, and Outcome interfaces
├── .env.example                # Example environment variable file
├── README.md                   # Project documentation & setup instructions
└── AGENTS.md                   # Agent architecture rules & guidelines
```

## Security & Architecture Rules
1. **API Key Isolation**:
   - `HINDSIGHT_API_KEY`, `HINDSIGHT_BANK_ID`, and `GROQ_API_KEY` must **NEVER** be exposed to the browser or prefixed with `NEXT_PUBLIC_`.
   - Access API clients exclusively from server components, server actions, or API route handlers.
2. **Hindsight Integration**:
   - Use the official `@vectorize-io/hindsight-client` library.
   - Core API operations used:
     - `recall(bankId, query)`: Search historical incident memories.
     - `retain(bankId, content, options)`: Store new incident diagnoses and post-repair outcomes.
     - `reflect(bankId, query)`: Synthesize contextual opinions or historical trends from memory banks.
3. **Groq Integration**:
   - Use `groq-sdk` with structured output requests (e.g. `response_format: { type: "json_object" }`).
   - Standard model for reasoning: `llama-3.3-70b-versatile`.
4. **Vercel Compatibility**:
   - Keep code strictly Vercel serverless compatible.
