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

    return items.map((item: unknown) => {
      if (typeof item === "string") {
        return { content: item };
      }
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>;
        const contentStr =
          typeof obj.content === "string"
            ? obj.content
            : typeof obj.text === "string"
            ? obj.text
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
            typeof obj.metadata === "object"
              ? (obj.metadata as Record<string, unknown>)
              : undefined,
        };
      }
      return { content: String(item) };
    });
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
[ENGINEERING EQUIPMENT INCIDENT]
Machine Name: ${incident.machineName}
Machine Type: ${incident.machineType}
Primary Problem: ${incident.problem}
Symptoms: ${Array.isArray(incident.symptoms) ? incident.symptoms.join(", ") : ""}
Operating Conditions: ${incident.operatingConditions || "Standard"}
Operating Temperature: ${incident.temperature || "N/A"}
Recent Maintenance / Changes: ${incident.recentChanges || "None reported"}
Previous Diagnostic Actions: ${incident.previousActions || "None reported"}
Additional Notes: ${incident.additionalNotes || "None"}

[DIAGNOSIS & ANALYSIS]
Summary: ${analysis.incidentSummary}
Possible Causes: ${analysis.possibleCauses.join("; ")}
Recommended Checks: ${analysis.recommendedChecks.join("; ")}
Recommended Actions: ${analysis.recommendedActions.join("; ")}
Confidence: ${analysis.confidenceExplanation}
Uncertainty: ${analysis.uncertaintyExplanation}
`.trim();

  try {
    const client = getHindsightClient();
    await client.retain(config.hindsightBankId, memoryContent, {
      timestamp: new Date(),
      context: "engineering equipment incident",
      metadata: {
        machineName: incident.machineName,
        machineType: incident.machineType,
        problem: incident.problem,
        confidenceScore: String(analysis.confidenceScore ?? 0.8),
      },
    });
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
      context: `Resolution Outcome for ${outcome.machineName}`,
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
