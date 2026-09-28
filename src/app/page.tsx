"use client";

import { useState } from "react";
import {
  EngineeringIncident,
  RecalledMemory,
  StructuredIncidentAnalysis,
  IncidentHistoryRecord,
  SystemStatus,
} from "@/types/incident";

// Built-in Demo Scenarios for 60-second hackathon demonstration
const DEMO_INCIDENT_1: EngineeringIncident = {
  machineName: "CNC Spindle #04",
  machineType: "CNC Precision Milling Spindle",
  problem: "Spindle motor overheating",
  symptoms: [
    "High vibration",
    "Abnormal spindle motor noise",
    "Temperature rising above normal operating range",
  ],
  operatingConditions: "High-load machining cycle",
  temperature: "87°C",
  recentChanges: "New cutting tool installed",
  previousActions: "Cooling airflow checked",
  additionalNotes: "Problem appears after approximately 40 minutes of continuous operation",
};

const DEMO_INCIDENT_2_SIMILAR: EngineeringIncident = {
  machineName: "CNC Spindle #08",
  machineType: "CNC Precision Milling Spindle",
  problem: "Spindle motor overheating and vibration under heavy feed",
  symptoms: [
    "Thermal spike above 85°C",
    "High-frequency vibration warning",
    "Cooling fan airflow drop",
  ],
  operatingConditions: "Heavy feed rate cutting cycle",
  temperature: "89°C",
  recentChanges: "Scheduled tool replacement completed 2 hours ago",
  previousActions: "Initial visual inspection of outer housing",
  additionalNotes: "Similar thermal pattern as CNC Spindle #04 incident",
};

const PIPELINE_STEPS = [
  { id: 1, label: "ANALYZING INCIDENT", desc: "Validating equipment telemetry & symptoms" },
  { id: 2, label: "SEARCHING HINDSIGHT", desc: "Connecting to Hindsight Cloud vector store" },
  { id: 3, label: "RECALLING EXPERIENCE", desc: "Retrieving relevant past machinery failure memories" },
  { id: 4, label: "REASONING WITH GROQ", desc: "Synthesizing current facts + historical context via llama-3.3-70b" },
  { id: 5, label: "GENERATING RESPONSE", desc: "Formatting diagnostic checks & priority checklist" },
  { id: 6, label: "STORING NEW EXPERIENCE", desc: "Retaining diagnosis into Hindsight memory bank" },
];

export default function Home() {
  const [form, setForm] = useState<EngineeringIncident>(DEMO_INCIDENT_1);
  const [symptomInput, setSymptomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentProgressStep, setCurrentProgressStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Analysis & Memory State
  const [recalledMemories, setRecalledMemories] = useState<RecalledMemory[]>([]);
  const [analysis, setAnalysis] = useState<StructuredIncidentAnalysis | null>(null);
  const [retained, setRetained] = useState<boolean>(false);
  const [showTransparency, setShowTransparency] = useState<boolean>(false);
  const [showInspector, setShowInspector] = useState<boolean>(false);

  // History & Telemetry
  const [history, setHistory] = useState<IncidentHistoryRecord[]>([]);
  const [status, setStatus] = useState<SystemStatus>({
    hindsightConnected: true,
    groqConnected: true,
    bankName: "engineering-incidents",
    memoriesRetrievedCount: 0,
  });

  // Outcome recording state
  const [outcomeForm, setOutcomeForm] = useState({
    actualOutcome: "",
    success: true,
    notes: "",
  });
  const [outcomeLoading, setOutcomeLoading] = useState(false);
  const [outcomeSuccess, setOutcomeSuccess] = useState<string | null>(null);

  // Demo Mode State
  const [demoStep, setDemoStep] = useState<number>(0); // 0 = idle, 1 = interaction 1 done, 2 = interaction 2 done

  const handleAddSymptom = () => {
    if (symptomInput.trim()) {
      setForm((prev) => ({
        ...prev,
        symptoms: [...prev.symptoms, symptomInput.trim()],
      }));
      setSymptomInput("");
    }
  };

  const handleRemoveSymptom = (index: number) => {
    setForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index),
    }));
  };

  const handleLoadDemoIncident = (demoType: 1 | 2 = 1) => {
    if (demoType === 1) {
      setForm(DEMO_INCIDENT_1);
    } else {
      setForm(DEMO_INCIDENT_2_SIMILAR);
    }
    setError(null);
  };

  const executePipeline = async (incidentData: EngineeringIncident) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setRecalledMemories([]);
    setRetained(false);
    setOutcomeSuccess(null);
    setCurrentProgressStep(1);

    // Simulate progress transitions for live demo transparency
    const stepTimer1 = setTimeout(() => setCurrentProgressStep(2), 250);
    const stepTimer2 = setTimeout(() => setCurrentProgressStep(3), 500);
    const stepTimer3 = setTimeout(() => setCurrentProgressStep(4), 800);
    const stepTimer4 = setTimeout(() => setCurrentProgressStep(5), 1200);

    try {
      const res = await fetch("/api/incident-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incidentData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Incident analysis failed");
      }

      setCurrentProgressStep(6);

      const recalled = data.recalledMemories || [];
      const analysisResult = data.analysis || null;
      const retainedState = data.retained || false;

      setRecalledMemories(recalled);
      setAnalysis(analysisResult);
      setRetained(retainedState);

      // Update telemetry & history
      const nowStr = new Date().toLocaleTimeString();
      setStatus((prev) => ({
        ...prev,
        lastRecallTimestamp: data.telemetry?.recallTimestamp || nowStr,
        lastRetainTimestamp: data.telemetry?.retainTimestamp || nowStr,
        memoriesRetrievedCount: recalled.length,
      }));

      if (analysisResult) {
        const newRecord: IncidentHistoryRecord = {
          id: `INC-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          machineName: incidentData.machineName,
          machineType: incidentData.machineType,
          problem: incidentData.problem,
          memoryStatus: recalled.length > 0 ? "RECALLED_AND_RETAINED" : "RETAINED",
          analysis: analysisResult,
          recalledMemories: recalled,
        };
        setHistory((prev) => [newRecord, ...prev]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
      setLoading(false);
      setCurrentProgressStep(0);
    }
  };

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    executePipeline(form);
  };

  const handleSubmitOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysis) return;

    setOutcomeLoading(true);
    setOutcomeSuccess(null);

    try {
      const res = await fetch("/api/incident-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machineName: form.machineName,
          machineType: form.machineType,
          diagnosis: analysis.incidentSummary,
          recommendedAction: analysis.recommendedActions[0] || "Standard maintenance",
          actualOutcome: outcomeForm.actualOutcome,
          success: outcomeForm.success,
          notes: outcomeForm.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Outcome submission failed");
      }

      setOutcomeSuccess("Resolution experience successfully retained into Hindsight memory!");
      setOutcomeForm({ actualOutcome: "", success: true, notes: "" });

      // Update inspector timestamp
      setStatus((prev) => ({
        ...prev,
        lastRetainTimestamp: new Date().toLocaleTimeString(),
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setOutcomeLoading(false);
    }
  };

  // Dedicated Learning Demo Walkthrough Step Handler
  const handleRunDemoStep1 = async () => {
    setDemoStep(1);
    handleLoadDemoIncident(1);
    await executePipeline(DEMO_INCIDENT_1);
  };

  const handleRunDemoStep2 = async () => {
    setDemoStep(2);
    handleLoadDemoIncident(2);
    await executePipeline(DEMO_INCIDENT_2_SIMILAR);
  };

  return (
    <main className="min-h-screen bg-control-room text-slate-100 flex flex-col font-mono selection:bg-cyan-900 selection:text-cyan-100">
      {/* HEADER BAR */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse-emerald shadow-[0_0_10px_#10b981]" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-widest text-white">MEMORY ENGINEER</h1>
              <span className="text-[10px] tracking-normal font-semibold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-700">
                AI INCIDENT INTELLIGENCE
              </span>
            </div>
            <p className="text-xs text-slate-400 tracking-wide mt-0.5">
              Diagnose today&apos;s failure using yesterday&apos;s experience.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300">SYSTEM STATUS:</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded text-[11px]">
            <span className="text-slate-400">HINDSIGHT: <span className="text-cyan-400 font-semibold">CONNECTED</span></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">GROQ: <span className="text-cyan-400 font-semibold">CONNECTED</span></span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* HACKATHON DEMO MODE BANNER */}
        <div className="panel-card-highlight p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/20 text-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/50 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-cyan-900 text-cyan-200 rounded text-[10px] font-bold tracking-wider uppercase">
                HACKATHON DEMO WALKTHROUGH
              </span>
              <span className="text-slate-200 font-bold">Continuous Learning Loop Demonstration</span>
            </div>
            <span className="text-cyan-400 text-[11px]">Real Hindsight Bank + Real Groq LLM</span>
          </div>

          <p className="text-slate-300 text-[11px] leading-relaxed">
            Watch how Memory Engineer becomes smarter over time. <strong className="text-white">Interaction 1</strong> retains an initial spindle failure context. <strong className="text-white">Interaction 2</strong> submits a similar issue, recalling the past incident and allowing Groq to generate a contextualized diagnosis.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={handleRunDemoStep1}
              disabled={loading}
              className={`px-3.5 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
                demoStep === 1
                  ? "bg-cyan-600 text-white border border-cyan-400"
                  : "bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
              }`}
            >
              <span>1. Run Incident #1 (CNC Spindle #04)</span>
            </button>

            <button
              type="button"
              onClick={handleRunDemoStep2}
              disabled={loading}
              className={`px-3.5 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
                demoStep === 2
                  ? "bg-emerald-600 text-white border border-emerald-400"
                  : "bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700"
              }`}
            >
              <span>2. Run Incident #2 (Similar CNC Spindle #08)</span>
            </button>

            <button
              type="button"
              onClick={() => handleLoadDemoIncident(1)}
              className="ml-auto bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded text-[11px]"
            >
              Populate Demo Form
            </button>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="p-4 border border-rose-800 rounded-xl bg-rose-950/40 text-rose-200 text-xs flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-rose-400">SERVICE ALERT: </span>
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">✕</button>
          </div>
        )}

        {/* LOADING & PROGRESS STEP INDICATOR */}
        {loading && (
          <div className="panel-card p-5 rounded-xl border border-cyan-800/80 bg-slate-950 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 tracking-wider uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                EXECUTION PIPELINE IN PROGRESS
              </span>
              <span className="text-xs text-slate-400 font-mono">STEP {currentProgressStep} OF 6</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-[11px]">
              {PIPELINE_STEPS.map((s) => {
                const isActive = currentProgressStep === s.id;
                const isPassed = currentProgressStep > s.id;
                return (
                  <div
                    key={s.id}
                    className={`p-2.5 rounded border transition-all ${
                      isActive
                        ? "bg-cyan-950 border-cyan-500 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                        : isPassed
                        ? "bg-slate-900 border-emerald-800/80 text-emerald-400"
                        : "bg-slate-950 border-slate-800 text-slate-600"
                    }`}
                  >
                    <div className="font-bold mb-1 flex items-center justify-between">
                      <span>0{s.id}. {s.label}</span>
                      {isPassed && <span>✓</span>}
                    </div>
                    <p className="text-[10px] leading-tight opacity-80">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DASHBOARD GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: INCIDENT INTAKE FORM (5 COLS) */}
          <div className="lg:col-span-5 panel-card rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-500 rounded-sm"></span>
                INCIDENT INTAKE TELEMETRY
              </h2>
              <span className="text-[10px] text-slate-500">FORM INGEST</span>
            </div>

            <form onSubmit={handleSubmitIncident} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Machine Name *</label>
                <input
                  type="text"
                  required
                  value={form.machineName}
                  onChange={(e) => setForm({ ...form, machineName: e.target.value })}
                  placeholder="e.g. CNC Spindle #04"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Machine Type *</label>
                <input
                  type="text"
                  required
                  value={form.machineType}
                  onChange={(e) => setForm({ ...form, machineType: e.target.value })}
                  placeholder="e.g. CNC Precision Milling Spindle"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Primary Problem *</label>
                <input
                  type="text"
                  required
                  value={form.problem}
                  onChange={(e) => setForm({ ...form, problem: e.target.value })}
                  placeholder="e.g. Spindle motor overheating"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Observed Symptoms *</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add symptom..."
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSymptom(); } }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSymptom}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {form.symptoms.map((sym, idx) => (
                    <span key={idx} className="bg-slate-950 border border-slate-800 text-cyan-300 px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5">
                      {sym}
                      <button
                        type="button"
                        onClick={() => handleRemoveSymptom(idx)}
                        className="text-slate-500 hover:text-rose-400 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Operating Conditions</label>
                  <input
                    type="text"
                    value={form.operatingConditions || ""}
                    onChange={(e) => setForm({ ...form, operatingConditions: e.target.value })}
                    placeholder="High-load machining"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Temperature</label>
                  <input
                    type="text"
                    value={form.temperature || ""}
                    onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                    placeholder="87°C"
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Recent Changes</label>
                <input
                  type="text"
                  value={form.recentChanges || ""}
                  onChange={(e) => setForm({ ...form, recentChanges: e.target.value })}
                  placeholder="New cutting tool installed"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Previous Actions</label>
                <input
                  type="text"
                  value={form.previousActions || ""}
                  onChange={(e) => setForm({ ...form, previousActions: e.target.value })}
                  placeholder="Cooling airflow checked"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Additional Notes</label>
                <textarea
                  rows={2}
                  value={form.additionalNotes || ""}
                  onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
                  placeholder="Problem appears after ~40 min of operation"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold py-2.5 px-4 rounded transition shadow-md shadow-emerald-950 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>EXECUTING RECALL & REASONING LOOP...</span>
                  ) : (
                    <>
                      <span>ANALYZE INCIDENT</span>
                      <span className="text-emerald-200">→</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadDemoIncident(1)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 py-1.5 px-3 rounded text-[11px]"
                  >
                    LOAD DEMO INCIDENT
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ machineName: "", machineType: "", problem: "", symptoms: [] })}
                    className="bg-slate-950 hover:bg-slate-900 text-slate-500 border border-slate-800 py-1.5 px-3 rounded text-[11px]"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: RECALL, ANALYSIS, CHECKLIST & LEARNING (7 COLS) */}
          <div className="lg:col-span-7 space-y-6">

            {/* LANDING EMPTY STATE (WHEN NO ANALYSIS ACTIVE) */}
            {!analysis && !loading && (
              <div className="panel-card rounded-xl p-8 text-center space-y-6 border border-slate-800">
                <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-400 flex items-center justify-center mx-auto text-xl font-bold">
                  🧠
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-base font-bold text-white tracking-wider">MEMORY ENGINEER INTELLIGENCE PLATFORM</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Your engineering team&apos;s memory, available at the moment of equipment failure. Submit an incident above or click <strong className="text-cyan-300">LOAD DEMO INCIDENT</strong> to initiate Hindsight memory recall.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left pt-2">
                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide">PERSISTENT MEMORY</div>
                    <p className="text-[11px] text-slate-400 leading-normal">Hindsight retains machinery failure patterns across days, weeks, and overhauls.</p>
                  </div>

                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">CONTEXTUAL REASONING</div>
                    <p className="text-[11px] text-slate-400 leading-normal">Groq LLM synthesizes current telemetry alongside recalled past experiences.</p>
                  </div>

                  <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wide">CONTINUOUS LEARNING</div>
                    <p className="text-[11px] text-slate-400 leading-normal">Resolved incident fixes feed back into Hindsight to improve future investigations.</p>
                  </div>
                </div>
              </div>
            )}

            {/* MEMORY RECALL PANEL */}
            {(analysis || recalledMemories.length > 0) && (
              <div className="panel-card rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                      MEMORY RECALL
                    </h2>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                      {recalledMemories.length} RELEVANT EXPERIENCES FOUND
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">HINDSIGHT CLOUD</span>
                </div>

                {recalledMemories.length === 0 ? (
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-400">
                    <p className="font-semibold text-slate-300 mb-1">First-Time Equipment Incident Detected</p>
                    <p className="text-[11px] text-slate-400">
                      No matching historical memories were retrieved from Hindsight Cloud for this machine/problem. Groq will perform baseline reasoning, and this incident will be retained to guide future failures.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {recalledMemories.map((mem, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-cyan-400 font-bold">PAST EXPERIENTIAL MEMORY #{idx + 1}</span>
                          {mem.relevanceScore && (
                            <span className="text-emerald-400 font-mono">Relevance: {(mem.relevanceScore * 100).toFixed(0)}%</span>
                          )}
                        </div>
                        <p className="text-slate-300 text-[11px] whitespace-pre-line leading-relaxed font-mono">
                          {mem.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* MEMORY TRANSPARENCY EXPANDABLE */}
                {recalledMemories.length > 0 && (
                  <div className="border-t border-slate-800/80 pt-2">
                    <button
                      onClick={() => setShowTransparency(!showTransparency)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <span>{showTransparency ? "▼ Hide" : "► Why was this memory retrieved?"}</span>
                    </button>
                    {showTransparency && (
                      <div className="mt-2 p-3 bg-slate-950/90 border border-slate-800 rounded text-[11px] text-slate-400 space-y-1">
                        <p className="text-slate-300 font-semibold">Vector Memory Retrieval Explanation:</p>
                        <p>
                          Hindsight Cloud retrieved these memory blocks because their embedding context relates directly to the current machine type (<strong className="text-white">{form.machineType}</strong>), problem description (<strong className="text-white">{form.problem}</strong>), and observed symptom cluster.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI ENGINEERING ANALYSIS CARD */}
            {analysis && (
              <div className="panel-card rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-sm"></span>
                    ENGINEERING ANALYSIS
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                      GROQ LLM (LLAMA-3.3-70B)
                    </span>
                    {retained && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                        MEMORY STORED
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {/* INCIDENT SUMMARY */}
                  <div>
                    <span className="text-slate-400 font-bold block mb-1 text-[11px]">INCIDENT SUMMARY</span>
                    <p className="text-slate-200 bg-slate-950 p-3 rounded border border-slate-800 leading-relaxed">
                      {analysis.incidentSummary}
                    </p>
                  </div>

                  {/* POSSIBLE CAUSES & HISTORICAL EVIDENCE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1.5">
                      <span className="text-slate-400 font-bold block text-[11px]">POSSIBLE ROOT CAUSES</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px]">
                        {analysis.possibleCauses.map((cause, i) => (
                          <li key={i}>{cause}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1.5">
                      <span className="text-slate-400 font-bold block text-[11px]">HISTORICAL EVIDENCE</span>
                      {analysis.historicalEvidence && analysis.historicalEvidence.length > 0 ? (
                        <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px]">
                          {analysis.historicalEvidence.map((ev, i) => (
                            <li key={i}>{ev}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 italic text-[11px]">
                          Historical evidence suggests baseline inspection until further past data is retained.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RECOMMENDED ACTIONS CHECKLIST */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-slate-400 font-bold text-[11px]">RECOMMENDED ACTIONS CHECKLIST</span>
                      <span className="text-[10px] text-slate-500">PRIORITIZED DIAGNOSTICS</span>
                    </div>

                    <div className="space-y-2">
                      {analysis.actionChecklist && analysis.actionChecklist.length > 0 ? (
                        analysis.actionChecklist.map((item, i) => (
                          <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="space-y-0.5 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.priority === "HIGH"
                                    ? "bg-rose-950 text-rose-300 border border-rose-800"
                                    : item.priority === "MEDIUM"
                                    ? "bg-amber-950 text-amber-300 border border-amber-800"
                                    : "bg-slate-900 text-slate-300 border border-slate-700"
                                }`}>
                                  {item.priority}
                                </span>
                                <span className="text-slate-200 font-bold text-[11px]">{item.action}</span>
                              </div>
                              <p className="text-slate-400 text-[11px] pl-0 md:pl-1 mt-1">{item.reason}</p>
                              {item.relatedExperience && (
                                <p className="text-cyan-400 text-[10px] italic">
                                  Related experience: {item.relatedExperience}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        analysis.recommendedActions.map((act, i) => (
                          <div key={i} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-slate-300 text-[11px]">
                            Recommended check: {act}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* CONFIDENCE & UNCERTAINTY EXPLANATION */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
                      <span className="text-emerald-400 font-bold block text-[11px]">CONFIDENCE REASONING</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{analysis.confidenceExplanation}</p>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
                      <span className="text-amber-400 font-bold block text-[11px]">UNCERTAINTY & RISKS</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{analysis.uncertaintyExplanation}</p>
                    </div>
                  </div>

                  {/* LEARNING / MEMORY STORED INDICATOR & VISUAL FLOW */}
                  <div className="p-4 bg-emerald-950/30 border border-emerald-800/80 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        MEMORY UPDATED IN HINDSIGHT
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">PERSISTENT MEMORY LOOP</span>
                    </div>

                    <p className="text-slate-300 text-[11px]">
                      Experience from this incident has been stored in Hindsight and will influence future investigations.
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold border-t border-emerald-900/60 pt-2.5 overflow-x-auto gap-2">
                      <span>INCIDENT</span>
                      <span>↓ RECALL</span>
                      <span>↓ ANALYSIS</span>
                      <span>↓ OUTCOME</span>
                      <span className="bg-emerald-900/80 px-2 py-0.5 rounded text-emerald-200">✓ MEMORY UPDATED</span>
                    </div>
                  </div>

                  {/* POST-REPAIR OUTCOME FEEDBACK FORM */}
                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    <span className="text-xs font-bold text-slate-200 block">
                      RECORD POST-REPAIR OUTCOME (FEED MEMORY)
                    </span>

                    {outcomeSuccess && (
                      <div className="p-2.5 bg-emerald-950 border border-emerald-800 text-emerald-200 rounded text-[11px]">
                        ✓ {outcomeSuccess}
                      </div>
                    )}

                    <form onSubmit={handleSubmitOutcome} className="space-y-2 text-xs">
                      <input
                        type="text"
                        required
                        placeholder="Actual repair outcome (e.g. Cleaned cooling intake duct mesh; spindle temp stabilized at 48°C)"
                        value={outcomeForm.actualOutcome}
                        onChange={(e) => setOutcomeForm({ ...outcomeForm, actualOutcome: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-slate-300 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={outcomeForm.success}
                            onChange={(e) => setOutcomeForm({ ...outcomeForm, success: e.target.checked })}
                            className="rounded bg-slate-950 border-slate-800 text-emerald-500"
                          />
                          <span>Repair Resolved Equipment Issue</span>
                        </label>
                        <button
                          type="submit"
                          disabled={outcomeLoading}
                          className="bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 text-white font-bold px-4 py-1.5 rounded text-xs transition shadow"
                        >
                          {outcomeLoading ? "Retaining Outcome..." : "Retain Outcome to Hindsight"}
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>

        {/* INCIDENT HISTORY SECTION */}
        {history.length > 0 && (
          <div className="panel-card rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
                <span>📜</span> INCIDENT INVESTIGATION HISTORY
              </h2>
              <span className="text-[10px] text-slate-500">{history.length} RECORDS IN SESSION</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {history.map((rec) => (
                <div key={rec.id} className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold">{rec.id}</span>
                      <span className="text-white font-semibold">{rec.machineName}</span>
                      <span className="text-slate-500">({rec.machineType})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{rec.timestamp}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                        {rec.memoryStatus}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-300 text-[11px]"><strong>Problem:</strong> {rec.problem}</p>
                  <p className="text-slate-400 text-[11px]"><strong>Diagnosis:</strong> {rec.analysis.incidentSummary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MEMORY INSPECTOR DEVELOPER PANEL */}
        <div className="border border-slate-800/80 bg-slate-950/90 rounded-xl p-3 text-xs">
          <button
            onClick={() => setShowInspector(!showInspector)}
            className="w-full flex items-center justify-between text-slate-400 hover:text-white transition"
          >
            <div className="flex items-center gap-2 font-bold text-[11px] tracking-wider uppercase">
              <span>🔧</span>
              <span>MEMORY INSPECTOR (DEVELOPER TELEMETRY)</span>
            </div>
            <span>{showInspector ? "▼ Hide" : "► Expand"}</span>
          </button>

          {showInspector && (
            <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 md:grid-cols-5 gap-3 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">HINDSIGHT BANK</span>
                <span className="text-cyan-300 font-bold">{status.bankName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">LAST RECALL</span>
                <span className="text-slate-200">{status.lastRecallTimestamp || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">MEMORIES RETRIEVED</span>
                <span className="text-emerald-400 font-bold">{status.memoriesRetrievedCount}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">LAST RETAINED</span>
                <span className="text-slate-200">{status.lastRetainTimestamp || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">MEMORY STATUS</span>
                <span className="text-emerald-400 font-bold">● Connected</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-4 px-6 text-xs text-slate-500 flex flex-wrap justify-between items-center gap-2 mt-auto bg-slate-950">
        <div>Memory Engineer — AI Engineering Incident Intelligence Agent</div>
        <div className="flex items-center gap-4">
          <span>Hindsight Cloud (@vectorize-io)</span>
          <span>•</span>
          <span>Groq API (llama-3.3-70b)</span>
        </div>
      </footer>
    </main>
  );
}
