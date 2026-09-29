import { NextResponse } from "next/server";
import { getServerConfig, describeKeyShape } from "@/lib/config";
import { recallRelevantIncidentsWithStatus } from "@/services/hindsight";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const config = getServerConfig();
  const apiKeyPresent = Boolean(process.env.HINDSIGHT_API_KEY && process.env.HINDSIGHT_API_KEY.trim());
  const bankIdFromEnv = Boolean(process.env.HINDSIGHT_BANK_ID && process.env.HINDSIGHT_BANK_ID.trim());

  const url = new URL(request.url);
  const probeQuery = url.searchParams.get("q") || "health check probe";

  const { memories, status } = await recallRelevantIncidentsWithStatus(probeQuery);

  const previews = memories.slice(0, 5).map((m) => {
    const text = m.content || "";
    return text.length > 80 ? text.slice(0, 80) + "..." : text;
  });

  return NextResponse.json({
    HINDSIGHT_API_KEY: apiKeyPresent ? "PRESENT" : "MISSING",
    apiKey: apiKeyPresent ? "PRESENT" : "MISSING",
    // Secret-free shape info (length, first 4 chars, formatting problems) to diagnose "Invalid API key format"
    apiKeyShape: describeKeyShape(process.env.HINDSIGHT_API_KEY),
    baseUrl: config.hindsightBaseUrl,
    bankId: config.hindsightBankId,
    bankIdFromEnv,
    probeRecall: {
      query: probeQuery,
      ok: status.ok,
      count: memories.length,
      previews,
      error: status.error || null,
    },
    count: memories.length,
    previews,
    ok: status.ok,
    error: status.error || null,
  });
}
