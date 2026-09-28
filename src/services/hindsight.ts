import { HindsightClient } from "@vectorize-io/hindsight-client";
import { getServerConfig } from "@/lib/config";
import { RecalledMemory } from "@/types/incident";

let instance: HindsightClient | null = null;

export function getHindsightClient(): HindsightClient {
  if (typeof window !== "undefined") {
    throw new Error("HindsightClient can only be instantiated on the server.");
  }

  if (!instance) {
    const config = getServerConfig();
    instance = new HindsightClient({
      baseUrl: config.hindsightBaseUrl,
      apiKey: config.hindsightApiKey,
      userAgent: "memory-engineer-agent/1.0",
    });
  }

  return instance;
}

export async function recallIncidentMemories(query: string): Promise<RecalledMemory[]> {
  const client = getHindsightClient();
  const config = getServerConfig();

  try {
    const results = await client.recall(config.hindsightBankId, query);

    // Normalize response from client
    if (Array.isArray(results)) {
      return results.map((item: unknown) => {
        if (typeof item === "string") {
          return { content: item };
        }
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>;
          return {
            id: typeof obj.id === "string" ? obj.id : undefined,
            content: typeof obj.content === "string" ? obj.content : JSON.stringify(obj),
            relevanceScore: typeof obj.score === "number" ? obj.score : undefined,
            metadata: typeof obj.metadata === "object" ? (obj.metadata as Record<string, unknown>) : undefined,
          };
        }
        return { content: String(item) };
      });
    }

    return [];
  } catch (error) {
    console.error("Hindsight recall error:", error);
    throw error;
  }
}

export async function storeIncidentMemory(
  content: string,
  context?: string,
  metadata?: Record<string, string>
): Promise<void> {
  const client = getHindsightClient();
  const config = getServerConfig();

  try {
    await client.retain(config.hindsightBankId, content, {
      timestamp: new Date(),
      context: context || "Engineering Incident Resolution",
      metadata,
    });
  } catch (error) {
    console.error("Hindsight retain error:", error);
    throw error;
  }
}

export async function reflectOnIncidents(query: string): Promise<string> {
  const client = getHindsightClient();
  const config = getServerConfig();

  try {
    const response = await client.reflect(config.hindsightBankId, query);
    return typeof response === "string" ? response : JSON.stringify(response);
  } catch (error) {
    console.error("Hindsight reflect error:", error);
    throw error;
  }
}
