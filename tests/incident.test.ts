import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateIncidentInput, EngineeringIncident } from "../src/types/incident";
import {
  recallRelevantIncidents,
  recallRelevantIncidentsWithStatus,
  retainIncident,
  retainOutcome,
  buildIncidentRecallQuery,
  describeHindsightError,
} from "../src/services/hindsight";
import { analyzeIncidentWithGroq } from "../src/services/groq";

describe("Memory Engineer Incident Validation", () => {
  it("rejects non-object or null input", () => {
    const result = validateIncidentInput(null);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.length > 0);
  });

  it("rejects payload missing machineName or symptoms", () => {
    const invalid = {
      machineType: "Hydraulic Pump",
      problem: "Pressure drop",
      symptoms: [],
    };
    const result = validateIncidentInput(invalid);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes("machineName")));
    assert.ok(result.errors.some((e) => e.includes("symptoms")));
  });

  it("accepts valid incident payload", () => {
    const valid = {
      machineName: "Pump P-101",
      machineType: "Hydraulic Centrifugal Pump",
      problem: "Cavitation noise and pressure drops",
      symptoms: ["Vibration at 120Hz", "Fluid aeration", "Pressure drop"],
      temperature: "75 C",
    };
    const result = validateIncidentInput(valid);
    assert.equal(result.isValid, true);
    assert.equal(result.errors.length, 0);
  });
});

describe("Hindsight Error Handling & Diagnostics", () => {
  it("describeHindsightError formats statusCode and redacts Bearer tokens", () => {
    const hindsightErr = {
      statusCode: 401,
      message: "Unauthorized access with Bearer secret_token_12345",
    };
    const described = describeHindsightError(hindsightErr);
    assert.equal(described, "HTTP 401: Unauthorized access with Bearer [REDACTED]");

    const plainErr = new Error("Network timeout with Bearer abcxyz");
    const describedPlain = describeHindsightError(plainErr);
    assert.equal(describedPlain, "Network timeout with Bearer [REDACTED]");
  });

  it("recallRelevantIncidentsWithStatus returns status object when unconfigured or empty query", async () => {
    const origKey = process.env.HINDSIGHT_API_KEY;
    delete process.env.HINDSIGHT_API_KEY;

    const unconfiguredRes = await recallRelevantIncidentsWithStatus("test query");
    assert.equal(unconfiguredRes.status.ok, false);
    assert.ok(unconfiguredRes.status.error?.includes("missing"));

    if (origKey) process.env.HINDSIGHT_API_KEY = origKey;

    const emptyRes = await recallRelevantIncidentsWithStatus("   ");
    assert.equal(emptyRes.status.ok, false);
    assert.ok(emptyRes.status.error?.includes("empty"));
  });

  it("retainIncident and retainOutcome return HindsightCallStatus when unconfigured", async () => {
    const origKey = process.env.HINDSIGHT_API_KEY;
    delete process.env.HINDSIGHT_API_KEY;

    const dummyIncident: EngineeringIncident = {
      machineName: "Pump P-101",
      machineType: "Centrifugal Pump",
      problem: "Vibration",
      symptoms: ["Vibration"],
    };
    const dummyAnalysis = {
      incidentSummary: "Vibration test",
      possibleCauses: ["Unbalance"],
      historicalMatches: [],
      recommendedChecks: ["Check alignment"],
      recommendedActions: ["Realign"],
      confidenceExplanation: "High",
      uncertaintyExplanation: "None",
      relevantMemoriesUsed: [],
    };

    const retainIncStatus = await retainIncident(dummyIncident, dummyAnalysis);
    assert.equal(retainIncStatus.ok, false);
    assert.ok(retainIncStatus.error?.includes("missing"));

    const retainOutStatus = await retainOutcome({
      machineName: "Pump P-101",
      diagnosis: "Vibration test",
      recommendedAction: "Check alignment",
      actualOutcome: "Realigned pump",
      success: true,
    });
    assert.equal(retainOutStatus.ok, false);
    assert.ok(retainOutStatus.error?.includes("missing"));

    if (origKey) process.env.HINDSIGHT_API_KEY = origKey;
  });
});

describe("Hindsight Service Memory Handling", () => {
  it("handles unconfigured Hindsight bank gracefully by returning empty list", async () => {
    // Save existing env
    const origKey = process.env.HINDSIGHT_API_KEY;
    delete process.env.HINDSIGHT_API_KEY;

    const memories = await recallRelevantIncidents("centrifugal pump cavitation");
    assert.ok(Array.isArray(memories));
    assert.equal(memories.length, 0);

    if (origKey) process.env.HINDSIGHT_API_KEY = origKey;
  });

  it("executes deterministic two-incident recall and retention loop when live environment is available", async () => {
    if (!process.env.HINDSIGHT_API_KEY || !process.env.GROQ_API_KEY) {
      console.log("Skipping live Hindsight/Groq two-incident test (missing API keys)");
      return;
    }

    // INCIDENT 1
    const incident1: EngineeringIncident = {
      machineName: "Hydraulic Pump P-102",
      machineType: "Centrifugal Hydraulic Pump",
      problem: "High-frequency vibration and pressure drop",
      symptoms: ["120 Hz vibration", "Fluid aeration", "12 bar pressure"],
      operatingConditions: "Peak load continuous operation",
      temperature: "80 C",
      recentChanges: "Inlet seal recently replaced",
      previousActions: "Inspected suction filter",
    };

    const analysis1 = {
      incidentSummary: "Incident 1: Hydraulic Pump P-102 120 Hz vibration, fluid aeration, and 12 bar pressure drop",
      possibleCauses: ["Air ingress at newly replaced inlet seal"],
      historicalMatches: [],
      recommendedChecks: ["Inspect seating of inlet seal O-ring"],
      recommendedActions: ["Re-seat primary inlet seal"],
      confidenceExplanation: "High confidence based on symptoms and recent maintenance",
      uncertaintyExplanation: "Internal component wear unverified",
      relevantMemoriesUsed: [],
      confidenceScore: 0.9,
    };

    // Retain Incident 1
    const status1 = await retainIncident(incident1, analysis1);
    assert.equal(status1.ok, true);

    // Wait 2 seconds for indexing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // INCIDENT 2 (similar problem)
    const incident2: EngineeringIncident = {
      machineName: "Hydraulic Pump P-102",
      machineType: "Centrifugal Hydraulic Pump",
      problem: "Persistent pressure drop and high vibration peak under high load",
      symptoms: ["118 Hz vibration", "Foaming fluid in sight glass", "12.5 bar pressure"],
      operatingConditions: "Continuous heavy duty load",
      temperature: "82 C",
      recentChanges: "Inlet seal replaced recently",
      previousActions: "Air bleed valve checked",
    };

    const recallQuery2 = buildIncidentRecallQuery(incident2);
    const recalledMemories = await recallRelevantIncidents(recallQuery2);

    assert.ok(recalledMemories.length > 0, "Recall results.length must be > 0");

    const matchedIncident1 = recalledMemories.some(
      (m) =>
        m.content.toLowerCase().includes("p-102") ||
        m.content.toLowerCase().includes("inlet seal") ||
        m.content.toLowerCase().includes("vibration") ||
        m.content.toLowerCase().includes("aeration")
    );
    assert.ok(matchedIncident1, "At least one recalled memory must relate to Incident 1");

    // Pass memories to Groq
    const analysis2 = await analyzeIncidentWithGroq(incident2, recalledMemories);
    assert.ok(analysis2.incidentSummary.length > 0, "Groq analysis summary must be generated");

    // Retain Incident 2
    const status2 = await retainIncident(incident2, analysis2);
    assert.equal(status2.ok, true);
  });
});
