import Groq from "groq-sdk";
import { getServerConfig } from "@/lib/config";
import { EngineeringIncident, RecalledMemory, StructuredIncidentAnalysis } from "@/types/incident";

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq {
  if (typeof window !== "undefined") {
    throw new Error("Groq client can only be instantiated on the server.");
  }

  if (!groqInstance) {
    const config = getServerConfig();
    groqInstance = new Groq({
      apiKey: config.groqApiKey || undefined,
    });
  }

  return groqInstance;
}

export async function analyzeIncidentWithGroq(
  incident: EngineeringIncident,
  recalledMemories: RecalledMemory[]
): Promise<StructuredIncidentAnalysis> {
  const config = getServerConfig();

  // If GROQ_API_KEY is missing, throw a clean, safe server error
  if (!config.groqApiKey) {
    throw new Error("Groq API Key is not configured on the server.");
  }

  const groq = getGroqClient();

  const memoryContextStr = recalledMemories.length > 0
    ? recalledMemories
        .map(
          (m, idx) =>
            `--- HISTORICAL MEMORY [${idx + 1}] ---\nContent: ${m.content}${
              m.relevanceScore ? `\nRelevance Score: ${m.relevanceScore}` : ""
            }`
        )
        .join("\n\n")
    : "No relevant historical memories were found in Hindsight Cloud for this machine/problem.";

  const prompt = `
You are Memory Engineer, an elite industrial reliability AI system.
Analyze the CURRENT INCIDENT using both real-time telemetry/facts AND historical memories retrieved from Hindsight Cloud.

CRITICAL INSTRUCTIONS:
1. Clearly distinguish between CURRENT INCIDENT FACTS and HISTORICAL MEMORIES.
2. Treat historical memories as prior experience/context, NOT guaranteed facts for the current machine.
3. Assess possible causes and explicit diagnostic checks based on pattern matches.
4. Express uncertainty and confidence explicitly.

--- CURRENT INCIDENT FACTS ---
Machine Name: ${incident.machineName}
Machine Type: ${incident.machineType}
Primary Problem: ${incident.problem}
Symptoms: ${incident.symptoms.join(", ")}
Operating Conditions: ${incident.operatingConditions || "Standard"}
Operating Temperature: ${incident.temperature || "Normal/Unspecified"}
Recent Maintenance / Changes: ${incident.recentChanges || "None reported"}
Previous Diagnostic Actions: ${incident.previousActions || "None reported"}
Additional Operator Notes: ${incident.additionalNotes || "None"}

--- RECALLED HISTORICAL HINDSIGHT MEMORIES ---
${memoryContextStr}

Return ONLY a single valid JSON object strictly conforming to this schema (no extra keys, no markdown code block formatting):
{
  "incidentSummary": "Concise summary of current equipment anomaly",
  "possibleCauses": ["Possible root cause 1", "Possible root cause 2"],
  "historicalMatches": [
    {
      "summary": "Brief summary of past similar incident retrieved from memory",
      "relevanceReason": "Why this historical memory applies or differs from the current situation"
    }
  ],
  "recommendedChecks": ["Step-by-step physical/sensor check 1", "Verification step 2"],
  "recommendedActions": ["Immediate corrective action 1", "Maintenance mitigation action 2"],
  "confidenceExplanation": "Explanation of reasoning confidence based on symptom overlap and memory alignment",
  "uncertaintyExplanation": "Explanation of remaining unknowns, missing telemetry, or potential alternative causes",
  "relevantMemoriesUsed": ["Excerpt or title of memory 1 used in this reasoning"],
  "confidenceScore": 0.85
}
`.trim();

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert industrial engineering AI. Respond exclusively in valid JSON format matching the requested schema.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content) as Partial<StructuredIncidentAnalysis>;

    return {
      incidentSummary: parsed.incidentSummary || `Incident analysis for ${incident.machineName}`,
      possibleCauses: Array.isArray(parsed.possibleCauses) ? parsed.possibleCauses : ["Unspecified mechanical or electrical issue."],
      historicalMatches: Array.isArray(parsed.historicalMatches) ? parsed.historicalMatches : [],
      recommendedChecks: Array.isArray(parsed.recommendedChecks) ? parsed.recommendedChecks : ["Perform visual inspection."],
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : ["Isolate machine and inspect components."],
      confidenceExplanation: parsed.confidenceExplanation || "Analysis derived from current symptoms and historical memory context.",
      uncertaintyExplanation: parsed.uncertaintyExplanation || "Further on-site diagnostic telemetry required to verify root cause.",
      relevantMemoriesUsed: Array.isArray(parsed.relevantMemoriesUsed) ? parsed.relevantMemoriesUsed : [],
      confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 0.8,
    };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("Groq incident analysis error:", errMessage);
    throw new Error(`Groq Analysis Failure: ${errMessage}`);
  }
}
