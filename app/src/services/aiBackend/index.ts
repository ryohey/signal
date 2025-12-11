import {
  AIBackendError,
  GenerateRequest,
  GenerateResponse,
  RegenerateRequest,
  RegenerateResponse,
} from "./types"

const API_BASE_URL =
  import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:8000"

class AIBackendService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    // Convert camelCase to snake_case for backend
    const requestBody = {
      prompt: request.prompt,
      agent_type: request.agentType || "composition_agent",
    }
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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

  async generateStream(
    request: GenerateRequest,
    onMessage: (content: string) => void,
    onComplete: (response: GenerateResponse) => void,
    onError: (error: Error) => void,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    try {
      // Convert camelCase to snake_case for backend
      const requestBody = {
        prompt: request.prompt,
        agent_type: request.agentType || "composition_agent",
      }
      const response = await fetch(`${this.baseUrl}/api/generate/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortSignal,
      })

      if (!response.ok) {
        throw new Error("Stream request failed")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      if (!reader) {
        throw new Error("No response body")
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Check if aborted
        if (abortSignal?.aborted) {
          reader.cancel()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === "message" && data.content) {
                onMessage(data.content)
              } else if (data.type === "complete") {
                // Convert snake_case to camelCase
                const response: GenerateResponse = {
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
                onComplete(response)
              } else if (data.type === "error") {
                onError(new Error(data.message || "Generation failed"))
              }
            } catch (e) {
              // Ignore JSON parse errors for malformed chunks
              console.warn("Failed to parse stream chunk:", e)
            }
          }
        }
      }
    } catch (error) {
      // Don't report abort as an error
      if (error instanceof Error && error.name === "AbortError") {
        return
      }
      onError(error instanceof Error ? error : new Error("Stream failed"))
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
