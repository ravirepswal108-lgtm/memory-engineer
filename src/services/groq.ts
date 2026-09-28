import Groq from "groq-sdk";
import { getServerConfig } from "@/lib/config";
import { EngineeringIncident, RecalledMemory, IncidentAnalysis } from "@/types/incident";

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq {
  if (typeof window !== "undefined") {
    throw new Error("Groq client can only be instantiated on the server.");
  }

  if (!groqInstance) {
    const config = getServerConfig();
    groqInstance = new Groq({
      apiKey: config.groqApiKey,
    });
  }

  return groqInstance;
}

export async function analyzeIncidentWithGroq(
  incident: EngineeringIncident,
  recalledMemories: RecalledMemory[]
): Promise<IncidentAnalysis> {
  const groq = getGroqClient();

  const memoryContextStr = recalledMemories.length > 0
    ? recalledMemories.map((m, idx) => `[Memory ${idx + 1}]: ${m.content}`).join("\n\n")
    : "No prior historical incidents or memories retrieved from Hindsight.";

  const prompt = `
You are Memory Engineer, an expert Industrial and Systems Reliability AI.
Analyze the following equipment incident by integrating current symptoms with historical memory context retrieved from Hindsight.

--- CURRENT INCIDENT ---
Equipment ID: ${incident.equipmentId}
Equipment Type: ${incident.equipmentType}
Title: ${incident.title}
Symptoms: ${incident.symptoms.join(", ")}
Operating Conditions: ${incident.operatingConditions || "Standard"}
Error Codes: ${incident.errorCodes?.join(", ") || "None"}

--- HISTORICAL HINDSIGHT MEMORIES ---
${memoryContextStr}

Instructions:
1. Provide a rigorous root cause analysis combining current symptoms and historical memory patterns.
2. Outline clear step-by-step diagnostic verification actions.
3. Provide recommended corrective/mitigation actions.
4. Estimate a confidence score between 0.0 and 1.0.
5. Explicitly reference any historical context memories that influenced your analysis.

Return ONLY a valid JSON object with the following structure (no markdown fences, no formatting markdown):
{
  "rootCauseAnalysis": "string",
  "diagnosticSteps": ["string"],
  "recommendedActions": ["string"],
  "confidenceScore": 0.85,
  "historicalContextUsed": ["string"]
}
`.trim();

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a professional industrial engineering intelligence system. Respond strictly with valid JSON.",
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
    const parsed = JSON.parse(content) as Partial<IncidentAnalysis>;

    return {
      rootCauseAnalysis: parsed.rootCauseAnalysis || "Analysis incomplete.",
      diagnosticSteps: Array.isArray(parsed.diagnosticSteps) ? parsed.diagnosticSteps : [],
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
      confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 0.7,
      historicalContextUsed: Array.isArray(parsed.historicalContextUsed) ? parsed.historicalContextUsed : [],
    };
  } catch (error) {
    console.error("Groq incident analysis error:", error);
    throw error;
  }
}
