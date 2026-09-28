import { EngineeringIncident, IncidentPipelineResult, IncidentOutcomeRecord } from "@/types/incident";
import { recallRelevantIncidents, retainIncident, retainOutcome } from "./hindsight";
import { analyzeIncidentWithGroq } from "./groq";

/**
 * End-to-end incident investigation pipeline:
 * 1. Understand incoming incident & symptoms
 * 2. Recall relevant historical memories from Hindsight
 * 3. Analyze current incident + memories using Groq LLM
 * 4. Retain new incident and diagnosis in Hindsight for future learning
 */
export function buildRecallQuery(incident: EngineeringIncident): string {
  const parts = [
    incident.machineName,
    incident.machineType,
    incident.problem,
    Array.isArray(incident.symptoms) ? incident.symptoms.join(" ") : "",
    incident.operatingConditions || "",
    incident.temperature || "",
    incident.recentChanges || "",
    incident.previousActions || "",
    incident.additionalNotes || "",
  ];
  return parts.filter((p) => Boolean(p && p.trim())).join(" ").trim();
}

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
  const query = buildRecallQuery(incident);

  // 1. Recall historical memories
  const recalledMemories = await recallRelevantIncidents(query);

  // 2. Perform AI analysis using Groq
  const analysis = await analyzeIncidentWithGroq(incident, recalledMemories);

  // 3. Store the new incident & diagnosis back into Hindsight
  await retainIncident(incident, analysis);

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
  await retainOutcome(outcome);
}
