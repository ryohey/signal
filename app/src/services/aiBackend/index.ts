import type { ProgressEvent as AIProgressEvent } from "./types"
import {
  AIBackendError,
  AttemptLog,
  DeepGenerateResponse,
  GenerateRequest,
  GenerateResponse,
  GenerationStage,
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

  // Deep Agent Architecture Methods

  async generateWithProgress(
    request: GenerateRequest,
    onProgress: (event: AIProgressEvent) => void,
  ): Promise<DeepGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/api/generate/stream`, {
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

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("No response body")
    }

    const decoder = new TextDecoder()
    let finalResult: DeepGenerateResponse | null = null

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            let data: Record<string, unknown>
            try {
              data = JSON.parse(line.slice(6))
            } catch (parseError) {
              // Skip malformed JSON lines (like keepalives)
              if (line.trim() !== "" && !line.startsWith(":")) {
                console.warn("Failed to parse SSE line:", line, parseError)
              }
              continue
            }

            // Convert snake_case to camelCase for event
            const event: AIProgressEvent = {
              stage: data.stage as GenerationStage,
              message: data.message as string | undefined,
              attempt: data.attempt as number | undefined,
              mode: data.mode as string | undefined,
              issues: data.issues as string[] | undefined,
              error: data.error as string | undefined,
            }

            if (data.result) {
              // Convert the full result
              finalResult = this.convertDeepResponse(
                data.result as Record<string, unknown>,
                data.attempt_logs as unknown[],
              )
              event.result = finalResult
            }

            if (data.attempt_logs) {
              event.attemptLogs = this.convertAttemptLogs(
                data.attempt_logs as unknown[],
              )
            }

            onProgress(event)

            // Error events should propagate to caller - this is outside the try-catch
            if (event.stage === "error") {
              throw new Error(event.error || "Generation failed")
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    if (!finalResult) {
      throw new Error("No result received")
    }

    return finalResult
  }

  private convertDeepResponse(
    data: Record<string, unknown>,
    attemptLogs: unknown[],
  ): DeepGenerateResponse {
    return {
      tracks: (data.tracks as Record<string, unknown>[]).map((t) => ({
        name: t.name as string,
        midiData: t.midi_data as string,
        channel: t.channel as number,
        programNumber: t.program_number as number,
      })),
      metadata: {
        tempo: (data.metadata as Record<string, unknown>).tempo as number,
        key: (data.metadata as Record<string, unknown>).key as string,
        timeSignature: (data.metadata as Record<string, unknown>)
          .time_signature as string,
      },
      message: data.message as string,
      attemptLogs: this.convertAttemptLogs(attemptLogs),
    }
  }

  private convertAttemptLogs(logs: unknown[]): AttemptLog[] {
    if (!logs) return []
    return (logs as Record<string, unknown>[]).map((log) => ({
      attempt: log.attempt as number,
      mode: log.mode as string,
      codeGenerated: log.code_generated as boolean,
      executionSuccess: log.execution_success as boolean,
      validationPassed: log.validation_passed as boolean,
      error: log.error as string | undefined,
      issues: log.issues as string[] | undefined,
      // Skip full validation result for now to keep it simple
    }))
  }
}

export const aiBackend = new AIBackendService()
export * from "./types"
