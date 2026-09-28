import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateIncidentInput, EngineeringIncident } from "../src/types/incident";
import { recallRelevantIncidents, retainIncident, buildIncidentRecallQuery } from "../src/services/hindsight";
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

describe("Hindsight Service Memory Handling", () => {
  it("handles unconfigured Hindsight bank gracefully by returning empty list", async () => {
    // Save existing env
    const origBank = process.env.HINDSIGHT_BANK_ID;
    delete process.env.HINDSIGHT_BANK_ID;

    const memories = await recallRelevantIncidents("centrifugal pump cavitation");
    assert.ok(Array.isArray(memories));
    assert.equal(memories.length, 0);

    if (origBank) process.env.HINDSIGHT_BANK_ID = origBank;
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
    await retainIncident(incident1, analysis1);

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
    await retainIncident(incident2, analysis2);
  });
});
