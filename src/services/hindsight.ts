import { HindsightClient } from "@vectorize-io/hindsight-client";
import { getServerConfig } from "@/lib/config";
import { EngineeringIncident, RecalledMemory, StructuredIncidentAnalysis, IncidentOutcomeRecord } from "@/types/incident";

export interface HindsightCallStatus {
  ok: boolean;
  error?: string;
}

let instance: HindsightClient | null = null;

/** Maximum number of recalled memories shown in the UI and passed to Groq. */
export const MAX_RECALLED_MEMORIES = 5;

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

export function describeHindsightError(error: unknown): string {
  let message = "";
  let statusCode: number | undefined;

  if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.statusCode === "number") {
      statusCode = errObj.statusCode;
    } else if (typeof errObj.status === "number") {
      statusCode = errObj.status;
    }

    if (typeof errObj.message === "string" && errObj.message) {
      message = errObj.message;
    } else {
      message = String(error);
    }
  } else {
    message = String(error);
  }

  let formatted = message;
  if (statusCode !== undefined && !message.startsWith(`HTTP ${statusCode}:`)) {
    formatted = `HTTP ${statusCode}: ${message}`;
  }

  // Redact any "Bearer xxx"
  return formatted.replace(/Bearer\s+[^\s"']+/gi, "Bearer [REDACTED]");
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
 * Recall relevant historical engineering memories with status from Hindsight Cloud
 */
export async function recallRelevantIncidentsWithStatus(query: string): Promise<{
  memories: RecalledMemory[];
  status: HindsightCallStatus;
}> {
  if (!query || !query.trim()) {
    const err = describeHindsightError("Query is empty");
    return { memories: [], status: { ok: false, error: err } };
  }

  const config = getServerConfig();
  if (!config.hindsightApiKey || !config.hindsightBankId) {
    const err = describeHindsightError("HINDSIGHT_API_KEY or HINDSIGHT_BANK_ID is missing");
    console.warn(err);
    return { memories: [], status: { ok: false, error: err } };
  }

  try {
    const client = getHindsightClient();
    const rawResponse = await client.recall(config.hindsightBankId, query, { budget: "mid" });

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

    // Hindsight returns results ranked by relevance; keep only the strongest matches
    // so the UI and the Groq prompt stay focused.
    return { memories: parsedMemories.slice(0, MAX_RECALLED_MEMORIES), status: { ok: true } };
  } catch (error: unknown) {
    const errMessage = describeHindsightError(error);
    console.error("Hindsight recall error:", errMessage);
    return { memories: [], status: { ok: false, error: errMessage } };
  }
}

/**
 * Recall relevant historical engineering memories from Hindsight Cloud (wrapper)
 */
export async function recallRelevantIncidents(query: string): Promise<RecalledMemory[]> {
  const result = await recallRelevantIncidentsWithStatus(query);
  return result.memories;
}

/**
 * Retain an engineering incident and its analysis in Hindsight Cloud
 */
export async function retainIncident(
  incident: EngineeringIncident,
  analysis: StructuredIncidentAnalysis
): Promise<HindsightCallStatus> {
  const config = getServerConfig();
  if (!config.hindsightApiKey || !config.hindsightBankId) {
    const err = describeHindsightError("HINDSIGHT_BANK_ID or HINDSIGHT_API_KEY is missing");
    console.warn(err);
    return { ok: false, error: err };
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

    if (typeof retainRes === "object" && retainRes !== null && (retainRes as Record<string, unknown>).success === false) {
      const errMsg = describeHindsightError((retainRes as Record<string, unknown>).error || "Retain incident returned success: false");
      console.error("Hindsight retain incident error:", errMsg);
      return { ok: false, error: errMsg };
    }

    const itemsCount = typeof retainRes === "object" && retainRes !== null && typeof (retainRes as Record<string, unknown>).items_count === "number"
      ? (retainRes as Record<string, unknown>).items_count
      : 1;
    const isAsync = typeof retainRes === "object" && retainRes !== null && typeof (retainRes as Record<string, unknown>).async === "boolean"
      ? (retainRes as Record<string, unknown>).async
      : false;

    console.log(`[HINDSIGHT DIAGNOSTIC] retain incident completed | bankId: ${config.hindsightBankId} | items_count: ${itemsCount} | async: ${isAsync}`);

    return { ok: true };
  } catch (error: unknown) {
    const errMessage = describeHindsightError(error);
    console.error("Hindsight retain incident error:", errMessage);
    return { ok: false, error: errMessage };
  }
}

/**
 * Retain a post-repair resolution outcome in Hindsight Cloud
 */
export async function retainOutcome(
  outcome: IncidentOutcomeRecord
): Promise<HindsightCallStatus> {
  const config = getServerConfig();
  if (!config.hindsightApiKey || !config.hindsightBankId) {
    const err = describeHindsightError("HINDSIGHT_BANK_ID or HINDSIGHT_API_KEY is missing");
    console.warn(err);
    return { ok: false, error: err };
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
    const retainRes = await client.retain(config.hindsightBankId, content, {
      timestamp: new Date(),
      context: "engineering equipment incident",
      metadata: {
        machineName: outcome.machineName,
        success: String(outcome.success),
      },
    });

    if (typeof retainRes === "object" && retainRes !== null && (retainRes as Record<string, unknown>).success === false) {
      const errMsg = describeHindsightError((retainRes as Record<string, unknown>).error || "Retain outcome returned success: false");
      console.error("Hindsight retain outcome error:", errMsg);
      return { ok: false, error: errMsg };
    }

    const itemsCount = typeof retainRes === "object" && retainRes !== null && typeof (retainRes as Record<string, unknown>).items_count === "number"
      ? (retainRes as Record<string, unknown>).items_count
      : 1;
    const isAsync = typeof retainRes === "object" && retainRes !== null && typeof (retainRes as Record<string, unknown>).async === "boolean"
      ? (retainRes as Record<string, unknown>).async
      : false;

    console.log(`[HINDSIGHT DIAGNOSTIC] retain outcome completed | bankId: ${config.hindsightBankId} | items_count: ${itemsCount} | async: ${isAsync}`);

    return { ok: true };
  } catch (error: unknown) {
    const errMessage = describeHindsightError(error);
    console.error("Hindsight retain outcome error:", errMessage);
    return { ok: false, error: errMessage };
  }
}
