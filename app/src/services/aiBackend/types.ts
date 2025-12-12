export interface TrackData {
  name: string
  midiData: string // base64 encoded
  channel: number
  programNumber: number
}

export interface SongMetadata {
  tempo: number
  key: string
  timeSignature: string
}

export interface GenerateRequest {
  prompt: string
  agentType?: "llm" | "composition_agent"
}

export interface GenerateResponse {
  tracks: TrackData[]
  metadata: SongMetadata
  message: string
}

export interface RegenerateRequest {
  trackName: string
  instruction: string
  context: {
    tempo: number
    key: string
    otherTracks: string[] // names of other tracks for context
  }
}

export interface RegenerateResponse {
  track: TrackData
  message: string
}

export interface AIBackendError {
  error: string
  detail?: string
}

// ============================================================================
// Deep Agent Architecture Types
// ============================================================================

export interface AttemptLog {
  attempt: number
  mode: string // "initial", "patch", "regenerate"
  codeGenerated: boolean
  executionSuccess: boolean
  validationPassed: boolean
  error?: string
  validationResult?: ValidationResult
  issues?: string[]
}

export interface ValidationResult {
  passed: boolean
  overallScore: number
  trackMetrics: TrackMetrics[]
  issues: string[]
  llmReview?: string
  suggestions: string[]
}

export interface TrackMetrics {
  name: string
  noteCount: number
  eighthNoteOrFasterPct: number
  syncopationScore: number
  velocityMin: number
  velocityMax: number
  velocityMean: number
  velocityStd: number
  notesPerBar: number
  silencePct: number
}

export interface DeepGenerateResponse extends GenerateResponse {
  attemptLogs: AttemptLog[]
  specUsed?: Record<string, unknown>
}

export type GenerationStage =
  | "planning"
  | "generating"
  | "executing"
  | "validating"
  | "refining"
  | "complete"
  | "error"

export interface ProgressEvent {
  stage: GenerationStage
  message?: string
  attempt?: number
  mode?: string
  issues?: string[]
  result?: DeepGenerateResponse
  attemptLogs?: AttemptLog[]
  error?: string
}
