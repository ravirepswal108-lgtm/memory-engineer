import { HindsightClient } from "@vectorize-io/hindsight-client";
import { getServerConfig } from "@/lib/config";
import { EngineeringIncident, RecalledMemory, StructuredIncidentAnalysis, IncidentOutcomeRecord } from "@/types/incident";

let instance: HindsightClient | null = null;

export function getHindsightClient(): HindsightClient {
  if (typeof window !== "undefined") {
    throw new Error("HindsightClient can only be instantiated on the server.");
  }

  if (!instance) {
    const config = getServerConfig();
    instance = new HindsightClient({
      baseUrl: config.hindsightBaseUrl,
      apiKey: config.hindsightApiKey || undefined,
      userAgent: "memory-engineer-agent/1.0",
    });
  }

  return instance;
}

/**
 * Construct a rich recall query from an Engineering Incident containing strong identifying information
 */
export function buildIncidentRecallQuery(incident: EngineeringIncident): string {
  const parts: string[] = [
    incident.machineName,
    incident.machineType,
    incident.problem,
    incident.symptoms.join(" "),
  ];

  if (incident.operatingConditions) parts.push(incident.operatingConditions);
  if (incident.temperature) parts.push(incident.temperature);
  if (incident.recentChanges) parts.push(incident.recentChanges);
  if (incident.previousActions) parts.push(incident.previousActions);
  if (incident.additionalNotes) parts.push(incident.additionalNotes);

  return parts.filter(Boolean).join(" ").trim();
}

/**
 * Recall relevant historical engineering memories from Hindsight Cloud
 */
export async function recallRelevantIncidents(query: string): Promise<RecalledMemory[]> {
  const config = getServerConfig();
  if (!config.hindsightBankId) {
    console.warn("HINDSIGHT_BANK_ID is not configured. Returning empty memories.");
    return [];
  }

  try {
    const client = getHindsightClient();
    const rawResponse = await client.recall(config.hindsightBankId, query);

    const items = Array.isArray(rawResponse)
      ? rawResponse
      : typeof rawResponse === "object" && rawResponse !== null && Array.isArray((rawResponse as Record<string, unknown>).results)
      ? ((rawResponse as Record<string, unknown>).results as unknown[])
      : [];

    const parsedMemories = items.map((item: unknown) => {
      if (typeof item === "string") {
        return { content: item };
      }
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>;
        const contentStr =
          typeof obj.text === "string" && obj.text.trim()
            ? obj.text
            : typeof obj.content === "string" && obj.content.trim()
            ? obj.content
            : JSON.stringify(obj);

        const score =
          typeof obj.score === "number"
            ? obj.score
            : typeof obj.scores === "object" &&
              obj.scores !== null &&
              typeof (obj.scores as Record<string, unknown>).final === "number"
            ? ((obj.scores as Record<string, unknown>).final as number)
            : undefined;

        return {
          id: typeof obj.id === "string" ? obj.id : undefined,
          content: contentStr,
          relevanceScore: score,
          metadata:
            typeof obj.metadata === "object" && obj.metadata !== null
              ? (obj.metadata as Record<string, unknown>)
              : undefined,
        };
      }
      return { content: String(item) };
    });

    // Safe diagnostic log without sensitive secrets/keys
    const types = [...new Set(items.map((i) => (typeof i === "object" && i !== null ? (i as Record<string, unknown>).type : "unknown")))];
    console.log(`[HINDSIGHT DIAGNOSTIC] recall completed | count: ${parsedMemories.length} | types: ${JSON.stringify(types)}`);
    if (parsedMemories.length > 0) {
      console.log(`[HINDSIGHT DIAGNOSTIC] top recall preview: "${parsedMemories[0].content.slice(0, 80)}..."`);
    }

    return parsedMemories;
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("Hindsight recall error:", errMessage);
    // Handle API errors gracefully and return empty memories so pipeline degrades safely
    return [];
  }
}

/**
 * Retain an engineering incident and its analysis in Hindsight Cloud
 */
export async function retainIncident(
  incident: EngineeringIncident,
  analysis: StructuredIncidentAnalysis
): Promise<void> {
  const config = getServerConfig();
  if (!config.hindsightBankId) {
    console.warn("HINDSIGHT_BANK_ID is not configured. Skipping retain.");
    return;
  }

  const memoryContent = `
[INCIDENT LOG]
Machine: ${incident.machineName} (${incident.machineType})
Problem: ${incident.problem}
Symptoms: ${incident.symptoms.join(", ")}
Operating Conditions: ${incident.operatingConditions || "Standard"}
Temperature: ${incident.temperature || "N/A"}
Recent Changes: ${incident.recentChanges || "None"}
Previous Actions: ${incident.previousActions || "None"}

[ENGINEERING ANALYSIS & DIAGNOSIS]
Summary: ${analysis.incidentSummary}
Possible Causes: ${analysis.possibleCauses.join("; ")}
Recommended Checks: ${analysis.recommendedChecks.join("; ")}
Recommended Actions: ${analysis.recommendedActions.join("; ")}
Confidence: ${analysis.confidenceExplanation}
Uncertainty: ${analysis.uncertaintyExplanation}
`.trim();

  try {
    const client = getHindsightClient();
    const retainRes = await client.retain(config.hindsightBankId, memoryContent, {
      timestamp: new Date(),
      context: "engineering equipment incident",
      metadata: {
        machineName: incident.machineName,
        machineType: incident.machineType,
        problem: incident.problem,
        confidenceScore: String(analysis.confidenceScore ?? 0.8),
      },
    });
    console.log(`[HINDSIGHT DIAGNOSTIC] retain incident completed | items_count: ${retainRes?.items_count ?? 1}`);
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("Hindsight retain incident error:", errMessage);
    // Log error, do not break caller execution
  }
}

/**
 * Retain a post-repair resolution outcome in Hindsight Cloud
 */
export async function retainOutcome(
  outcome: IncidentOutcomeRecord
): Promise<void> {
  const config = getServerConfig();
  if (!config.hindsightBankId) {
    console.warn("HINDSIGHT_BANK_ID is not configured. Skipping outcome retain.");
    return;
  }

  const content = `
[POST-REPAIR OUTCOME RECORD]
Machine Name: ${outcome.machineName}
Diagnosis Addressed: ${outcome.diagnosis}
Recommended Action Executed: ${outcome.recommendedAction}
Actual Repair Outcome: ${outcome.actualOutcome}
Resolution Success: ${outcome.success ? "SUCCESSFUL" : "UNSUCCESSFUL"}
Notes: ${outcome.notes || "None"}
`.trim();

  try {
    const client = getHindsightClient();
    await client.retain(config.hindsightBankId, content, {
      timestamp: new Date(),
      context: "engineering equipment incident",
      metadata: {
        machineName: outcome.machineName,
        success: String(outcome.success),
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("Hindsight retain outcome error:", errMessage);
  }
}
