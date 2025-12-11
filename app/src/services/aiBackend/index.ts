import {
  GenerateRequest,
  GenerateResponse,
  RegenerateRequest,
  RegenerateResponse,
  AIBackendError,
} from "./types"

const API_BASE_URL =
  import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:8000"

class AIBackendService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error: AIBackendError = await response.json()
      throw new Error(error.detail || error.error || "Generation failed")
    }

    // Convert snake_case to camelCase
    const data = await response.json()
    return {
      tracks: data.tracks.map((t: Record<string, unknown>) => ({
        name: t.name,
        midiData: t.midi_data,
        channel: t.channel,
        programNumber: t.program_number,
      })),
      metadata: {
        tempo: data.metadata.tempo,
        key: data.metadata.key,
        timeSignature: data.metadata.time_signature,
      },
      message: data.message,
    }
  }

  async regenerate(request: RegenerateRequest): Promise<RegenerateResponse> {
    // Convert camelCase to snake_case for request
    const requestBody = {
      track_name: request.trackName,
      instruction: request.instruction,
      context: {
        tempo: request.context.tempo,
        key: request.context.key,
        otherTracks: request.context.otherTracks,
      },
    }

    const response = await fetch(`${this.baseUrl}/api/regenerate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error: AIBackendError = await response.json()
      throw new Error(error.detail || error.error || "Regeneration failed")
    }

    // Convert snake_case to camelCase
    const data = await response.json()
    return {
      track: {
        name: data.track.name,
        midiData: data.track.midi_data,
        channel: data.track.channel,
        programNumber: data.track.program_number,
      },
      message: data.message,
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`)
      return response.ok
    } catch {
      return false
    }
  }
}

export const aiBackend = new AIBackendService()
export * from "./types"
