# Memory Engineer — AI Engineering Incident Intelligence Agent

> **"Diagnose today's failure using yesterday's experience."**

Built for the **AI Agents That Learn Using Hindsight** Hackathon.

---

## 🛠️ Problem Statement

Industrial maintenance and reliability engineers repeatedly investigate complex equipment anomalies (thermal spikes, vibration spikes, pressure drops) without the benefit of past maintenance experience.

When an engineer resolves a failure on machine #04, that critical diagnostic experience is often trapped in unindexed logs or personal memory. Weeks later, when a similar failure hits machine #08, a different engineer must re-learn the diagnostic steps from scratch.

---

## ⚡ The Solution

**Memory Engineer** gives an AI engineering agent **persistent memory** using **Hindsight Cloud** and high-speed LLM reasoning with **Groq** (`llama-3.3-70b-versatile`).

Instead of static prompt engineering, Memory Engineer continuously learns:
1. **Intake**: Collects telemetry (`machineName`, `machineType`, `problem`, `symptoms`, `operatingConditions`, `temperature`, `recentChanges`, `previousActions`).
2. **Recall**: Queries **Hindsight Cloud** to retrieve relevant historical machinery failure memories, previous root causes, and repair outcomes.
3. **Reason**: Passes current telemetry + recalled past experience to **Groq LLM** to generate an objective engineering diagnosis, risk assessment, and prioritized action checklist.
4. **Retain**: Stores the new diagnosis, diagnostic checks, and post-repair resolution outcomes back into **Hindsight Cloud** so future incidents get smarter.

---

## 🏗️ Architecture & Memory Loop

```text
  [ USER EQUIPMENT INCIDENT ]
              │
              ▼
    [ HINDSIGHT RECALL ]  ──────> Queries Hindsight Cloud vector store
              │
              ▼
   [ RELEVANT PAST EXPERIENCES ] ─> Recalled failure context & past repair outcomes
              │
              ▼
    [ GROQ LLM REASONING ] ─────> Synthesizes current facts + past memories
              │
              ▼
   [ ENGINEERING DIAGNOSIS ]  ───> Summary, Causes, Evidence & Action Checklist
              │
              ▼
    [ HINDSIGHT RETAIN ]  ───────> Persists new experience & post-repair outcomes
              │
              ▼
   [ FUTURE INCIDENTS SMARTER ]
```

---

## 🎬 60-Second Hackathon Demo Workflow

The UI includes a dedicated **HACKATHON DEMO WALKTHROUGH** banner at the top of the dashboard:

### Interaction 1: Sparse Context (First Equipment Anomaly)
1. Click **"1. Run Incident #1 (CNC Spindle #04)"**.
2. Telemetry is submitted: CNC Spindle #04, motor overheating (87°C), vibration, new cutting tool installed.
3. **Hindsight Recall**: Finds 0 previous memories for this specific machine.
4. **Groq Reasoning**: Performs baseline engineering reasoning and identifies potential cooling or bearing issues.
5. **Hindsight Retain**: Memory Engineer automatically stores the incident diagnosis and post-repair fix into Hindsight.

### Interaction 2: Persistent Learning Recall (Similar Equipment Failure)
1. Click **"2. Run Incident #2 (Similar CNC Spindle #08)"**.
2. Telemetry is submitted for a similar machine: CNC Spindle #08, overheating (89°C), vibration.
3. **Hindsight Recall**: Immediately retrieves the retained experience from **Incident #1**.
4. **Groq Reasoning**: Groq synthesizes current facts + recalled experience from Incident #1, producing a higher-confidence diagnosis linking the thermal pattern to cooling intake airflow restrictions.
5. **Result**: The agent got demonstrably smarter as engineering experience accumulated!

---

## 🎨 Control-Room Visual Interface

The Memory Engineer dashboard is designed as a dark industrial control-room intelligence platform:
* Charcoal & dark slate aesthetic (`#080c14`) with technical grid background.
* Live status indicators: `● MEMORY SYSTEM ONLINE`, `HINDSIGHT CONNECTED`, `GROQ CONNECTED`.
* Multi-add symptom intake tags with built-in realistic demo scenario prefill.
* Real-time 6-step progress pipeline execution status.
* Memory Recall panel with expandable **"Why was this memory retrieved?"** transparency.
* Engineering Analysis card with prioritized Action Checklist (`HIGH`, `MEDIUM`, `LOW`), historical evidence, and non-guaranteed engineering caution.
* Post-repair outcome feedback form to feed repair fixes back into Hindsight.
* Session Incident History list and expandable **Memory Inspector** developer panel.

---

## 🔒 Security & Environment Variables

Create `.env.local` or configure environment variables in your server runtime:

```env
HINDSIGHT_API_KEY=your_hindsight_api_key
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_BANK_ID=engineering-incidents
GROQ_API_KEY=your_groq_api_key
```

### Security Directives
* API keys are accessed **exclusively server-side** via `src/lib/config.ts`.
* Secrets are **NEVER** exposed to the browser or prefixed with `NEXT_PUBLIC_`.
* The Memory Inspector panel displays operational status without exposing credentials.

---

## 🔌 API Endpoints

### 1. `POST /api/incident-analysis`
Executes validation, Hindsight recall, Groq reasoning, and Hindsight retention.

**Request Body Example:**
```json
{
  "machineName": "CNC Spindle #04",
  "machineType": "CNC Precision Milling Spindle",
  "problem": "Spindle motor overheating",
  "symptoms": ["High vibration", "Noise", "Temp > 85°C"],
  "operatingConditions": "High-load machining cycle",
  "temperature": "87°C",
  "recentChanges": "New cutting tool installed",
  "previousActions": "Cooling airflow checked"
}
```

### 2. `POST /api/incident-outcome`
Retains post-repair outcome records into Hindsight Cloud.

**Request Body Example:**
```json
{
  "machineName": "CNC Spindle #04",
  "diagnosis": "Spindle motor overheating due to intake airflow restriction",
  "recommendedAction": "Inspect cooling airflow and clean intake mesh filter",
  "actualOutcome": "Cleaned cooling air intake duct mesh; spindle temperature stabilized at 48°C.",
  "success": true
}
```

---

## 🧪 Local Development & Verification

1. Install dependencies:
```bash
npm install
```

2. Run unit & integration tests:
```bash
npm test
```

3. Run TypeScript type check:
```bash
npx tsc --noEmit
```

4. Run linter:
```bash
npm run lint
```

5. Build production bundle:
```bash
npm run build
```

6. Run pipeline verification audit:
```bash
npx tsx scripts/verify-pipeline.ts
```
