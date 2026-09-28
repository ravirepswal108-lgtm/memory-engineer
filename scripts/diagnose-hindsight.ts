import { getHindsightClient } from "../src/services/hindsight";
import { getServerConfig } from "../src/lib/config";

async function runDiagnostic() {
  console.log("Starting Hindsight live diagnostic test...");

  const config = getServerConfig();
  if (!config.hindsightBankId || !config.hindsightApiKey) {
    console.error("HINDSIGHT credentials missing.");
    process.exit(1);
  }

  const client = getHindsightClient();
  const bankId = config.hindsightBankId;

  // 1. Retain explicit engineering memory
  const testIncidentText =
    "Engineering incident for Hydraulic Pump P-102, a centrifugal hydraulic pump. During peak-load continuous operation at 80 degrees Celsius, the pump developed 120 Hz high-frequency vibration, hydraulic line fluid aeration, and output pressure dropping to 12 bar. The inlet seal had recently been replaced. Diagnostic actions included bleeding air valves and clearing the suction filter. Diagnosis involved cavitation/fluid aeration and possible inlet seal air ingress. Recommended actions included checking NPSH, inspecting the inlet seal, bleeding trapped air, checking bearings/impeller, and controlling operating temperature.";

  const retainStart = Date.now();
  const retainResult = await client.retain(bankId, testIncidentText, {
    context: "engineering equipment incident",
    timestamp: new Date(),
    metadata: {
      machineName: "Hydraulic Pump P-102",
      machineType: "Centrifugal Hydraulic Pump",
      diagnosticTest: "true",
    },
  });

  const retainDuration = Date.now() - retainStart;
  console.log(`Retain completed in ${retainDuration}ms.`);

  const retainCount = retainResult.items_count ?? 1;

  // Wait 1.5 seconds for indexing
  await new Promise((r) => setTimeout(r, 1500));

  // 4. Perform direct recall
  const query =
    "Hydraulic Pump P-102 high-frequency 120 Hz vibration pressure drop 12 bar fluid aeration 80 degrees Celsius recently replaced inlet seal";

  const recallStart = Date.now();
  const recallResponse = await client.recall(bankId, query);
  const recallDuration = Date.now() - recallStart;
  console.log(`Recall completed in ${recallDuration}ms.`);

  const results = Array.isArray(recallResponse?.results) ? recallResponse.results : [];
  const recallCount = results.length;

  const memoryTypes = [...new Set(results.map((r: { type?: string | null }) => r.type || "unknown"))];
  const safeMemoryPreviews = results.slice(0, 5).map((r: { text?: string; type?: string | null }) => ({
    type: r.type || "unknown",
    textPreview: (r.text || "").slice(0, 80) + "...",
  }));

  console.log("\n==================================================");
  console.log("            DIAGNOSTIC TEST RESULTS               ");
  console.log("==================================================");
  console.log(`RETAIN_COUNT: ${retainCount}`);
  console.log(`RECALL_COUNT: ${recallCount}`);
  console.log(`MEMORY_TYPES: ${JSON.stringify(memoryTypes)}`);
  console.log(`SAFE_MEMORY_PREVIEWS: ${JSON.stringify(safeMemoryPreviews, null, 2)}`);
  console.log("==================================================\n");
}

runDiagnostic().catch((err) => {
  console.error("Diagnostic error:", err);
  process.exit(1);
});
