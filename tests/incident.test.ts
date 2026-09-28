import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateIncidentInput, EngineeringIncident } from "../src/types/incident";
import { recallRelevantIncidents } from "../src/services/hindsight";
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
    const valid: EngineeringIncident = {
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
    const origBank = process.env.HINDSIGHT_BANK_ID;
    delete process.env.HINDSIGHT_BANK_ID;

    const memories = await recallRelevantIncidents("centrifugal pump cavitation");
    assert.ok(Array.isArray(memories));
    assert.equal(memories.length, 0);

    if (origBank) process.env.HINDSIGHT_BANK_ID = origBank;
  });

  it("returns empty array safely when recall service throws error", async () => {
    const origBaseUrl = process.env.HINDSIGHT_BASE_URL;
    process.env.HINDSIGHT_BASE_URL = "https://invalid-hindsight-domain-999.example.com";

    const memories = await recallRelevantIncidents("test error query");
    assert.ok(Array.isArray(memories));
    assert.equal(memories.length, 0);

    if (origBaseUrl) process.env.HINDSIGHT_BASE_URL = origBaseUrl;
  });
});

describe("Groq AI Analysis Service Resilience", () => {
  it("throws safe configuration error when GROQ_API_KEY is missing", async () => {
    const origGroqKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    const incident: EngineeringIncident = {
      machineName: "CNC Spindle #04",
      machineType: "Milling Spindle",
      problem: "Overheating",
      symptoms: ["Thermal spike"],
    };

    await assert.rejects(
      async () => {
        await analyzeIncidentWithGroq(incident, []);
      },
      (err: Error) => {
        assert.ok(err.message.includes("Groq API Key is not configured"));
        return true;
      }
    );

    if (origGroqKey) process.env.GROQ_API_KEY = origGroqKey;
  });
});
