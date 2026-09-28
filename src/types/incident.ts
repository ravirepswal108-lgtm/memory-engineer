/**
 * Domain types for Memory Engineer - AI Engineering Incident Intelligence Agent
 */

export interface EngineeringIncident {
  id?: string;
  machineName: string;
  machineType: string;
  problem: string;
  symptoms: string[];
  operatingConditions?: string;
  temperature?: string;
  recentChanges?: string;
  previousActions?: string;
  additionalNotes?: string;
  timestamp?: string;
}

export interface RecalledMemory {
  id?: string;
  content: string;
  relevanceScore?: number;
  metadata?: Record<string, unknown>;
}

export interface HistoricalMatch {
  summary: string;
  relevanceReason: string;
  incidentId?: string;
  outcome?: string;
}

export interface ActionChecklistItem {
  action: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  relatedExperience?: string;
}

export interface StructuredIncidentAnalysis {
  incidentSummary: string;
  possibleCauses: string[];
  historicalMatches: HistoricalMatch[];
  historicalEvidence?: string[];
  recommendedChecks: string[];
  recommendedActions: string[];
  actionChecklist?: ActionChecklistItem[];
  confidenceExplanation: string;
  uncertaintyExplanation: string;
  relevantMemoriesUsed: string[];
  confidenceScore?: number;
}

export interface SystemStatus {
  hindsightConnected: boolean;
  groqConnected: boolean;
  bankName: string;
  lastRecallTimestamp?: string;
  lastRetainTimestamp?: string;
  memoriesRetrievedCount: number;
}

export interface PipelineStepInfo {
  step: number;
  label: string;
  description: string;
  status: "idle" | "running" | "completed" | "error";
}

export interface IncidentHistoryRecord {
  id: string;
  timestamp: string;
  machineName: string;
  machineType: string;
  problem: string;
  outcome?: string;
  memoryStatus: "RETAINED" | "RECALLED_AND_RETAINED" | "PENDING";
  analysis: StructuredIncidentAnalysis;
  recalledMemories: RecalledMemory[];
}

export interface IncidentPipelineResult {
  incident: EngineeringIncident;
  recalledMemories: RecalledMemory[];
  analysis: StructuredIncidentAnalysis;
  retainedMemoryId?: string;
}

export interface IncidentOutcomeRecord {
  incidentId?: string;
  machineName: string;
  machineType?: string;
  diagnosis: string;
  recommendedAction: string;
  actualOutcome: string;
  success: boolean;
  notes?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateIncidentInput(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Invalid incident payload: must be an object."] };
  }

  const payload = data as Partial<EngineeringIncident>;

  if (!payload.machineName || typeof payload.machineName !== "string" || !payload.machineName.trim()) {
    errors.push("Field 'machineName' is required and must be a non-empty string.");
  }

  if (!payload.machineType || typeof payload.machineType !== "string" || !payload.machineType.trim()) {
    errors.push("Field 'machineType' is required and must be a non-empty string.");
  }

  if (!payload.problem || typeof payload.problem !== "string" || !payload.problem.trim()) {
    errors.push("Field 'problem' is required and must be a non-empty string.");
  }

  if (!Array.isArray(payload.symptoms) || payload.symptoms.length === 0) {
    errors.push("Field 'symptoms' is required and must be a non-empty array of strings.");
  } else if (!payload.symptoms.every((s) => typeof s === "string" && s.trim())) {
    errors.push("All items in 'symptoms' must be non-empty strings.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
