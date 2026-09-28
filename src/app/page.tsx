export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-xl font-bold tracking-wider text-slate-100">
            MEMORY ENGINEER <span className="text-xs font-normal px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 ml-2">v1.0 ONLINE</span>
          </h1>
        </div>
        <div className="flex items-center space-x-6 text-xs text-slate-400">
          <div><span className="text-slate-500">MEMORY SYSTEM:</span> Hindsight Cloud</div>
          <div><span className="text-slate-500">LLM REASONING:</span> Groq API</div>
          <div><span className="text-slate-500">STATUS:</span> OPERATIONAL</div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Banner */}
        <div className="p-4 border border-cyan-800/50 rounded-lg bg-cyan-950/20 text-cyan-200 text-sm flex items-start space-x-3">
          <svg className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-semibold text-cyan-300">Engineering Incident Intelligence Dashboard</span> —
            Memory Engineer retains equipment failure histories in <span className="underline decoration-cyan-500">Hindsight Cloud</span> and applies <span className="underline decoration-cyan-500">Groq LLM</span> reasoning to diagnose new incidents using past hindsight memories.
          </div>
        </div>

        {/* System Architecture Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Incident Intake */}
          <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">1. Incident Intake</h2>
              <span className="text-xs text-slate-500 font-mono">INPUT</span>
            </div>
            <p className="text-xs text-slate-400">
              Captures equipment telemetry, observed symptoms, error codes, and operational parameters from active plant machinery.
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1 text-slate-300">
              <div className="text-emerald-400">$ telemetry intake --active</div>
              <div>[Equipment]: Hydraulic Pump P-102</div>
              <div>[Symptom]: Cavitation vibration, fluid pressure drop</div>
              <div>[ErrorCode]: ERR-SYS-409</div>
            </div>
          </div>

          {/* Card 2: Hindsight Context Retrieval */}
          <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">2. Hindsight Memory</h2>
              <span className="text-xs text-slate-500 font-mono">RECALL</span>
            </div>
            <p className="text-xs text-slate-400">
              Queries Hindsight memory banks to recall historical failures, prior successful resolutions, and past maintenance reflections.
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1 text-slate-300">
              <div className="text-cyan-400">$ hindsight.recall(&quot;P-102 cavitation&quot;)</div>
              <div>[Match 1]: Replaced suction filter mesh on Unit P-101 (92%)</div>
              <div>[Match 2]: Aeration in hydraulic fluid line (87%)</div>
            </div>
          </div>

          {/* Card 3: Groq LLM Analysis */}
          <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">3. Groq Reasoning</h2>
              <span className="text-xs text-slate-500 font-mono">ANALYSIS</span>
            </div>
            <p className="text-xs text-slate-400">
              Synthesizes real-time incident symptoms with recalled Hindsight memories to produce structured engineering diagnoses.
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1 text-slate-300">
              <div className="text-amber-400">$ groq.analyze(incident + memories)</div>
              <div>Root Cause: Suction line filter restriction</div>
              <div>Confidence: 0.94</div>
              <div>Retained to Hindsight: YES</div>
            </div>
          </div>
        </div>

        {/* Live Architecture Status Panel */}
        <div className="border border-slate-800 bg-slate-900/30 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
            Server Services Architecture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
              <div className="text-slate-400">Hindsight Service</div>
              <div className="text-emerald-400 font-semibold">@vectorize-io/hindsight-client</div>
              <div className="text-slate-500 text-[10px]">`retain`, `recall`, `reflect`</div>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
              <div className="text-slate-400">Groq LLM Service</div>
              <div className="text-emerald-400 font-semibold">groq-sdk</div>
              <div className="text-slate-500 text-[10px]">`llama-3.3-70b-versatile`</div>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
              <div className="text-slate-400">Incident Pipeline</div>
              <div className="text-emerald-400 font-semibold">src/services/incident.ts</div>
              <div className="text-slate-500 text-[10px]">Recall -&gt; Reason -&gt; Retain</div>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-1">
              <div className="text-slate-400">Environment Security</div>
              <div className="text-emerald-400 font-semibold">src/lib/config.ts</div>
              <div className="text-slate-500 text-[10px]">Server-side API key guard</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Footer */}
      <footer className="border-t border-slate-800 py-4 px-6 text-xs text-slate-500 flex justify-between items-center mt-auto">
        <div>Memory Engineer AI — Built for the AI Agents That Learn Using Hindsight Hackathon</div>
        <div>Vercel-Compatible Architecture</div>
      </footer>
    </main>
  );
}
