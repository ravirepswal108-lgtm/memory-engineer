import { NextResponse } from "next/server";
import { validateIncidentInput, EngineeringIncident } from "@/types/incident";
import { recallRelevantIncidents, retainIncident } from "@/services/hindsight";
import { analyzeIncidentWithGroq } from "@/services/groq";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate incoming incident input
    const validation = validateIncidentInput(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "Invalid incident payload",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    const incident = body as EngineeringIncident;

    // 2. Formulate query for Hindsight recall
    const recallQuery = `${incident.machineType} ${incident.machineName} ${incident.problem} ${incident.symptoms.join(" ")}`.trim();

    // 3. Recall relevant historical memories from Hindsight
    const recallStartTime = new Date().toISOString();
    let recalledMemories: import("@/types/incident").RecalledMemory[] = [];
    let hindsightStatusMessage: string | null = null;

    try {
      recalledMemories = await recallRelevantIncidents(recallQuery);
    } catch (hindsightError: unknown) {
      console.error("Hindsight recall service error:", hindsightError);
      hindsightStatusMessage = "Memory service temporarily unavailable.";
    }

    // 4. Analyze incident using Groq LLM with historical memory context
    let analysis;
    try {
      analysis = await analyzeIncidentWithGroq(incident, recalledMemories);
    } catch (groqError: unknown) {
      console.error("Groq reasoning service error:", groqError);
      return NextResponse.json(
        {
          error: "AI reasoning service temporarily unavailable.",
          message: "AI reasoning service temporarily unavailable.",
        },
        { status: 503 }
      );
    }

    // 5. Retain newly analyzed incident & diagnosis in Hindsight for future learning
    const retainStartTime = new Date().toISOString();
    let retained = false;
    try {
      await retainIncident(incident, analysis);
      retained = true;
    } catch (retainError: unknown) {
      console.error("Hindsight retain service error:", retainError);
    }

    // 6. Return structured engineering result
    return NextResponse.json({
      success: true,
      incident,
      recalledMemories,
      analysis,
      retained,
      hindsightStatusMessage,
      telemetry: {
        recallTimestamp: recallStartTime,
        retainTimestamp: retainStartTime,
        memoriesRetrievedCount: recalledMemories.length,
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("API /api/incident-analysis error:", errMessage);

    return NextResponse.json(
      {
        error: "Incident analysis failed",
        message: errMessage.includes("Groq") || errMessage.includes("AI reasoning")
          ? "AI reasoning service temporarily unavailable."
          : errMessage.includes("Hindsight")
          ? "Memory service temporarily unavailable."
          : "An unexpected error occurred while processing the incident analysis.",
      },
      { status: 500 }
    );
  }
}
