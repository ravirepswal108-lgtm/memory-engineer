# Memory Engineer — AI Engineering Incident Intelligence Agent

Built for the **AI Agents That Learn Using Hindsight** Hackathon.

## What the Project Does

**Memory Engineer** is a full-stack engineering incident intelligence agent designed for industrial equipment maintenance and systems reliability engineering.

When a complex equipment anomaly or breakdown occurs, engineers provide observed symptoms, error codes, and operational parameters. Memory Engineer executes a four-stage cognitive loop:

1. **Intake**: Parses the engineering incident and equipment context.
2. **Recall**: Queries **Hindsight Cloud** to retrieve relevant past incidents, root cause resolutions, and equipment failure patterns.
3. **Reason**: Passes the current incident along with recalled historical context into **Groq LLM** to produce a structured engineering root-cause analysis, step-by-step diagnostic verification plan, and recommended mitigation actions.
4. **Retain**: Automatically stores the new incident diagnosis and resolution outcomes into **Hindsight Cloud**, improving future recall and reasoning capabilities.

---

## Why Hindsight is Required

Standard LLMs lack persistent cross-session memory and context from past equipment failures across an industrial plant. Generic chatbots fail to learn from past maintenance outcomes.

**Hindsight Cloud** provides the core persistent semantic memory bank for Memory Engineer. With Hindsight:
* Previous equipment diagnostic discoveries are permanently remembered.
* Long-term failure patterns (such as recurrent bearing wear or hydraulic cavitation under specific temperature ranges) are continuously accumulated.
* Future incident analyses automatically improve as more incident resolutions are retained in the memory bank.

---

## How Memory Works

Memory Engineer interacts with Hindsight through three primary operations:

* **`recall(bankId, query)`**: Searches Hindsight's semantic memory banks for past incident records matching current equipment types, symptoms, and error codes.
* **`retain(bankId, content, options)`**: Stores newly analyzed incidents, root causes, and post-repair outcomes back into Hindsight with structured metadata.
* **`reflect(bankId, query)`**: Queries the Hindsight bank for high-level reflections and historical insights across all past stored experiences.

---

## How Groq is Used

**Groq** serves as the high-speed LLM inference engine powering the agent's analytical reasoning.

* **Model**: `llama-3.3-70b-versatile` via `groq-sdk`.
* **Process**: Takes the structured telemetry from the incident along with recalled Hindsight memories, and produces a JSON object containing root cause analysis, diagnostic verification steps, corrective actions, and confidence scores.

---

## Required Environment Variables

Create a `.env.local` file in the root directory based on `.env.example`:

```env
HINDSIGHT_API_KEY=your_hindsight_api_key
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_BANK_ID=engineering-incidents
GROQ_API_KEY=your_groq_api_key
```

---

## How to Run the Project Locally

### Prerequisites
* Node.js v18 or later
* npm / yarn / pnpm

### Installation & Execution

1. Clone repository and install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`.

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Run production build check:
```bash
npm run build
```
