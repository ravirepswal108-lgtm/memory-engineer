/**
 * Domain types for Memory Engineer - AI Engineering Incident Intelligence
 */

export interface EngineeringIncident {
  id?: string;
  equipmentId: string;
  equipmentType: string;
  title: string;
  symptoms: string[];
  operatingConditions?: string;
  errorCodes?: string[];
  timestamp?: string;
}

export interface RecalledMemory {
  id?: string;
  content: string;
  relevanceScore?: number;
  metadata?: Record<string, unknown>;
}

export interface IncidentAnalysis {
  rootCauseAnalysis: string;
  diagnosticSteps: string[];
  recommendedActions: string[];
  confidenceScore: number;
  historicalContextUsed: string[];
}

export interface IncidentPipelineResult {
  incident: EngineeringIncident;
  recalledMemories: RecalledMemory[];
  analysis: IncidentAnalysis;
  retainedMemoryId?: string;
}

export interface IncidentOutcomeRecord {
  incidentId: string;
  equipmentId: string;
  diagnosis: string;
  recommendedAction: string;
  actualOutcome: string;
  success: boolean;
  notes?: string;
}
