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
