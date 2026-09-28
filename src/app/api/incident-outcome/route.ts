import { NextResponse } from "next/server";
import { retainOutcome } from "@/services/hindsight";
import { IncidentOutcomeRecord } from "@/types/incident";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const record = body as IncidentOutcomeRecord;

    if (!record.machineName || !record.actualOutcome) {
      return NextResponse.json(
        { error: "Fields 'machineName' and 'actualOutcome' are required." },
        { status: 400 }
      );
    }

    await retainOutcome(record);

    return NextResponse.json({
      success: true,
      message: "Incident repair outcome retained in Hindsight memory bank.",
      record,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("API /api/incident-outcome error:", errMessage);

    return NextResponse.json(
      { error: "Failed to store outcome in Hindsight." },
      { status: 500 }
    );
  }
}
