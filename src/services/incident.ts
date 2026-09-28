import { EngineeringIncident, IncidentPipelineResult, IncidentOutcomeRecord } from "@/types/incident";
import { recallIncidentMemories, storeIncidentMemory } from "./hindsight";
import { analyzeIncidentWithGroq } from "./groq";

/**
 * End-to-end incident investigation pipeline:
 * 1. Understand incoming incident & symptoms
 * 2. Recall relevant historical memories from Hindsight
 * 3. Analyze current incident + memories using Groq LLM
 * 4. Retain new incident and diagnosis in Hindsight for future learning
 */
export async function processIncidentPipeline(
  incident: EngineeringIncident
): Promise<IncidentPipelineResult> {
  const query = `${incident.equipmentType} ${incident.title} ${incident.symptoms.join(" ")} ${incident.errorCodes?.join(" ") || ""}`.trim();

  // 1. Recall historical memories
  const recalledMemories = await recallIncidentMemories(query);

  // 2. Perform AI analysis using Groq
  const analysis = await analyzeIncidentWithGroq(incident, recalledMemories);

  // 3. Store the new incident & diagnosis back into Hindsight
  const memoryContent = `
Equipment: ${incident.equipmentType} (${incident.equipmentId})
Title: ${incident.title}
Symptoms: ${incident.symptoms.join(", ")}
Error Codes: ${incident.errorCodes?.join(", ") || "None"}
Diagnosis / Root Cause: ${analysis.rootCauseAnalysis}
Recommended Action: ${analysis.recommendedActions.join("; ")}
`.trim();

  await storeIncidentMemory(
    memoryContent,
    `Incident Investigation: ${incident.equipmentId}`,
    {
      equipmentId: incident.equipmentId,
      equipmentType: incident.equipmentType,
      confidenceScore: String(analysis.confidenceScore),
    }
  );

  return {
    incident,
    recalledMemories,
    analysis,
  };
}

/**
 * Store incident outcome / resolution after repair to improve future hindsight recall
 */
export async function recordIncidentOutcome(
  outcome: IncidentOutcomeRecord
): Promise<void> {
  const content = `
Incident Outcome Record for ${outcome.equipmentId}:
Diagnosis: ${outcome.diagnosis}
Recommended Action: ${outcome.recommendedAction}
Actual Outcome: ${outcome.actualOutcome}
Success: ${outcome.success ? "YES" : "NO"}
Notes: ${outcome.notes || "None"}
`.trim();

  await storeIncidentMemory(
    content,
    `Post-Repair Resolution Outcome: ${outcome.equipmentId}`,
    {
      incidentId: outcome.incidentId,
      equipmentId: outcome.equipmentId,
      success: String(outcome.success),
    }
  );
}
