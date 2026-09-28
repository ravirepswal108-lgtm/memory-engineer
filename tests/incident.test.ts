import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateIncidentInput } from "../src/types/incident";
import { recallRelevantIncidents } from "../src/services/hindsight";

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
});
