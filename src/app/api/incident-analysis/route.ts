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
    const recalledMemories = await recallRelevantIncidents(recallQuery);

    // 4. Analyze incident using Groq LLM with historical memory context
    const analysis = await analyzeIncidentWithGroq(incident, recalledMemories);

    // 5. Retain newly analyzed incident & diagnosis in Hindsight for future learning
    await retainIncident(incident, analysis);

    // 6. Return structured engineering result
    return NextResponse.json({
      success: true,
      incident,
      recalledMemories,
      analysis,
      retained: true,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("API /api/incident-analysis error:", errMessage);

    return NextResponse.json(
      {
        error: "Incident analysis failed",
        message: errMessage.includes("API Key") || errMessage.includes("Groq")
          ? errMessage
          : "An unexpected error occurred while processing the incident analysis.",
      },
      { status: 500 }
    );
  }
}
