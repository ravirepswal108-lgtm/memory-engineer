"use client";

import { useState } from "react";
import { EngineeringIncident, RecalledMemory, StructuredIncidentAnalysis } from "@/types/incident";

interface HindsightStatus {
  recallOk?: boolean;
  recallError?: string;
  recallCount?: number;
  retainOk?: boolean;
  retainError?: string;
}

export default function Home() {
  const [form, setForm] = useState<EngineeringIncident>({
    machineName: "Hydraulic Pump P-102",
    machineType: "Centrifugal Hydraulic Pump",
    problem: "Cavitation vibration & pressure drop under high load",
    symptoms: ["120Hz high-frequency vibration", "Hydraulic line fluid aeration", "Output pressure drop to 12 bar"],
    operatingConditions: "Peak load continuous operation, 85% duty cycle",
    temperature: "78°C (Elevated)",
    recentChanges: "Replaced primary inlet seal during weekly overhaul",
    previousActions: "Bleed air valves checked; suction filter cleared",
    additionalNotes: "Vibration intensifies when oil temp exceeds 75°C",
  });

  const [symptomInput, setSymptomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recalledMemories, setRecalledMemories] = useState<RecalledMemory[]>([]);
  const [analysis, setAnalysis] = useState<StructuredIncidentAnalysis | null>(null);
  const [retained, setRetained] = useState<boolean>(false);
  const [hindsight, setHindsight] = useState<HindsightStatus | null>(null);

  // Outcome recording state
  const [outcomeForm, setOutcomeForm] = useState({
    actualOutcome: "",
    success: true,
    notes: "",
  });
  const [outcomeLoading, setOutcomeLoading] = useState(false);
  const [outcomeSuccess, setOutcomeSuccess] = useState<string | null>(null);

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

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setRecalledMemories([]);
    setRetained(false);
    setHindsight(null);
    setOutcomeSuccess(null);

    try {
      const res = await fetch("/api/incident-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Analysis failed");
      }

      setRecalledMemories(data.recalledMemories || []);
      setAnalysis(data.analysis || null);
      setRetained(data.retained === true);
      if (data.hindsight) {
        setHindsight(data.hindsight);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
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

      setOutcomeSuccess("Resolution outcome successfully retained in Hindsight Cloud!");
      setOutcomeForm({ actualOutcome: "", success: true, notes: "" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setOutcomeLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-xl font-bold tracking-wider text-slate-100">
            MEMORY ENGINEER <span className="text-xs font-normal px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 ml-2">v1.0 AGENT</span>
          </h1>
        </div>
        <div className="flex items-center space-x-6 text-xs text-slate-400">
          <div><span className="text-slate-500">PERSISTENT MEMORY:</span> Hindsight Cloud</div>
          <div><span className="text-slate-500">LLM REASONING:</span> Groq API</div>
          <div><span className="text-slate-500">STATUS:</span> READY</div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner */}
        <div className="p-4 border border-cyan-800/50 rounded-lg bg-cyan-950/20 text-cyan-200 text-sm">
          <span className="font-semibold text-cyan-300">AI Engineering Incident Intelligence Agent Loop:</span>
          Recalls historical machinery memories from <span className="text-white font-bold">Hindsight Cloud</span>, synthesizes current telemetry using <span className="text-white font-bold">Groq LLM</span>, and retains new diagnoses &amp; outcomes for persistent future learning.
        </div>

        {error && (
          <div className="p-4 border border-rose-800/80 rounded-lg bg-rose-950/40 text-rose-200 text-sm">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Panel (5 Cols) */}
          <div className="lg:col-span-5 border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
              1. Incident Telemetry Intake
            </h2>

            <form onSubmit={handleSubmitIncident} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Machine Name *</label>
                <input
                  type="text"
                  required
                  value={form.machineName}
                  onChange={(e) => setForm({ ...form, machineName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Machine Type *</label>
                <input
                  type="text"
                  required
                  value={form.machineType}
                  onChange={(e) => setForm({ ...form, machineType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Primary Problem *</label>
                <input
                  type="text"
                  required
                  value={form.problem}
                  onChange={(e) => setForm({ ...form, problem: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Observed Symptoms *</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add symptom..."
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSymptom}
                    className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-slate-200"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {form.symptoms.map((sym, idx) => (
                    <span key={idx} className="bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                      {sym}
                      <button
                        type="button"
                        onClick={() => handleRemoveSymptom(idx)}
                        className="text-slate-500 hover:text-rose-400 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Operating Conditions</label>
                  <input
                    type="text"
                    value={form.operatingConditions || ""}
                    onChange={(e) => setForm({ ...form, operatingConditions: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Temperature</label>
                  <input
                    type="text"
                    value={form.temperature || ""}
                    onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Recent Maintenance / Changes</label>
                <input
                  type="text"
                  value={form.recentChanges || ""}
                  onChange={(e) => setForm({ ...form, recentChanges: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Previous Diagnostic Actions</label>
                <input
                  type="text"
                  value={form.previousActions || ""}
                  onChange={(e) => setForm({ ...form, previousActions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold py-2 px-4 rounded transition"
              >
                {loading ? "Recall Hindsight Memories & Reasoning with Groq..." : "Execute Memory Loop & Analyze"}
              </button>
            </form>
          </div>

          {/* Results Panel (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Recalled Memories */}
            <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  2. Recalled Hindsight Memories ({recalledMemories.length})
                </h2>
                <span className="text-[10px] text-cyan-400 font-mono">HINDSIGHT RECALL</span>
              </div>

              {hindsight && hindsight.recallOk === false && hindsight.recallError && (
                <div className="p-3 border border-rose-800/80 rounded bg-rose-950/40 text-rose-200 text-xs font-semibold">
                  HINDSIGHT RECALL FAILED: {hindsight.recallError}
                </div>
              )}

              {hindsight && hindsight.retainOk === false && hindsight.retainError && (
                <div className="p-3 border border-rose-800/80 rounded bg-rose-950/40 text-rose-200 text-xs font-semibold">
                  HINDSIGHT RETAIN FAILED: {hindsight.retainError}
                </div>
              )}

              {recalledMemories.length === 0 ? (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded text-xs text-slate-500 italic">
                  No previous memories retrieved yet. Submit an incident to trigger Hindsight Cloud memory recall.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {recalledMemories.map((mem, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1">
                      <div className="flex justify-between text-cyan-400 text-[10px]">
                        <span>MEMORY RECORD #{idx + 1}</span>
                        {typeof mem.relevanceScore === "number" && <span>Match score: {mem.relevanceScore.toFixed(2)}</span>}
                      </div>
                      <p className="text-slate-300 text-[11px] whitespace-pre-line">{mem.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Groq Analysis Output */}
            <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  3. Groq LLM Structured Analysis
                </h2>
                {retained && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    RETAINED TO HINDSIGHT
                  </span>
                )}
              </div>

              {!analysis ? (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded text-xs text-slate-500 italic">
                  Analysis output will appear here after executing the pipeline.
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-1">INCIDENT SUMMARY</span>
                    <p className="text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800">{analysis.incidentSummary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">POSSIBLE CAUSES</span>
                      <ul className="list-disc list-inside bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 space-y-1">
                        {analysis.possibleCauses.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">RECOMMENDED ACTIONS</span>
                      <ul className="list-disc list-inside bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 space-y-1">
                        {analysis.recommendedActions.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {analysis.historicalMatches && analysis.historicalMatches.length > 0 && (
                    <div>
                      <span className="text-slate-400 font-semibold block mb-1">HISTORICAL MEMORY MATCHES</span>
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-2">
                        {analysis.historicalMatches.map((hm, i) => (
                          <div key={i} className="border-b border-slate-800 last:border-0 pb-1 last:pb-0">
                            <div className="text-cyan-400">{hm.summary}</div>
                            <div className="text-slate-400 text-[11px]">{hm.relevanceReason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-emerald-400 font-semibold block mb-1">CONFIDENCE REASONING</span>
                      <p className="text-slate-300 text-[11px]">{analysis.confidenceExplanation}</p>
                    </div>

                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                      <span className="text-amber-400 font-semibold block mb-1">UNCERTAINTY EXPLANATION</span>
                      <p className="text-slate-300 text-[11px]">{analysis.uncertaintyExplanation}</p>
                    </div>
                  </div>

                  {/* Outcome Feedback Form */}
                  <div className="mt-4 border-t border-slate-800 pt-3">
                    <span className="text-xs font-semibold text-slate-300 block mb-2">4. Record Post-Repair Outcome (Persistent Learning)</span>

                    {outcomeSuccess && (
                      <div className="p-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded mb-2 text-[11px]">
                        {outcomeSuccess}
                      </div>
                    )}

                    <form onSubmit={handleSubmitOutcome} className="space-y-2">
                      <input
                        type="text"
                        required
                        placeholder="Actual repair outcome (e.g., Replaced cavitation-damaged suction valve; pressure restored)"
                        value={outcomeForm.actualOutcome}
                        onChange={(e) => setOutcomeForm({ ...outcomeForm, actualOutcome: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-100 text-xs"
                      />
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-slate-400 text-xs">
                          <input
                            type="checkbox"
                            checked={outcomeForm.success}
                            onChange={(e) => setOutcomeForm({ ...outcomeForm, success: e.target.checked })}
                            className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                          />
                          Repair Successful
                        </label>
                        <button
                          type="submit"
                          disabled={outcomeLoading}
                          className="ml-auto bg-cyan-700 hover:bg-cyan-600 disabled:bg-slate-800 text-white px-3 py-1 rounded text-xs"
                        >
                          {outcomeLoading ? "Retaining Outcome..." : "Retain Outcome to Hindsight"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-800 py-4 px-6 text-xs text-slate-500 flex justify-between items-center mt-auto">
        <div>Memory Engineer AI — Built for the AI Agents That Learn Using Hindsight Hackathon</div>
        <div>Hindsight Cloud + Groq Integration</div>
      </footer>
    </main>
  );
}
