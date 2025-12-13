/**
 * Streaming hybrid agent loop - uses SSE for real-time updates.
 *
 * Consumes SSE from /api/agent/step/stream and handles tool execution
 * with stream reconnection for resume operations.
 *
 * Supports multi-turn conversations by tracking thread_id. The thread
 * persists across messages, allowing natural back-and-forth conversation.
 */

import type { Song } from "@signal-app/core"
import {
  executeToolCalls,
  type ToolCall,
  type ToolResult,
} from "./toolExecutor"
import {
  serializeSongState,
  formatSongStateForPrompt,
} from "./songStateSerializer"

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

/** SSE event types from the backend */
type SSEEventType =
  | "thinking"
  | "tool_calls"
  | "tool_results_received"
  | "message"
  | "error"

interface SSEEvent {
  type: SSEEventType
  thread_id: string
  content?: string
  tool_calls?: ToolCall[]
  count?: number
  done?: boolean
  error?: string
}

/** Reason why the agent loop ended */
export type AgentStopReason =
  | "complete" // Agent finished (may continue in next turn)
  | "error" // An error occurred
  | "aborted" // User aborted

/** Result of running the agent loop */
export interface AgentLoopResult {
  success: boolean
  message?: string
  threadId?: string // Thread ID for continuing the conversation
  stopReason: AgentStopReason
}

interface StreamingCallbacks {
  /** Called when agent is thinking/processing (streamed tokens) */
  onThinking?: (content: string) => void
  /** Called when tool calls need to be executed */
  onToolCalls?: (toolCalls: ToolCall[]) => void
  /** Called after tool calls are executed with results */
  onToolsExecuted?: (toolCalls: ToolCall[], results: ToolResult[]) => void
  /** Called when agent sends final message */
  onMessage?: (message: string) => void
  /** Called on any error */
  onError?: (error: Error) => void
  /** Called when stream completes (for any reason) */
  onComplete?: (result: AgentLoopResult) => void
}

/**
 * Parse SSE data from a text chunk.
 * SSE format: "data: {...}\n\n"
 */
function parseSSEEvents(text: string): SSEEvent[] {
  const events: SSEEvent[] = []
  const lines = text.split("\n")

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        const json = line.slice(6) // Remove "data: " prefix
        if (json.trim()) {
          events.push(JSON.parse(json))
        }
      } catch (e) {
        console.warn("[AgentStream] Failed to parse SSE event:", line, e)
      }
    }
  }

  return events
}

/**
 * Consume SSE stream from a fetch response.
 */
async function* consumeSSEStream(
  response: Response,
  abortSignal?: AbortSignal,
): AsyncGenerator<SSEEvent> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error("No response body")
  }

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      if (abortSignal?.aborted) {
        break
      }

      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process complete events (ending with \n\n)
      const parts = buffer.split("\n\n")
      buffer = parts.pop() ?? "" // Keep incomplete part in buffer

      for (const part of parts) {
        const events = parseSSEEvents(part + "\n")
        for (const event of events) {
          yield event
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      const events = parseSSEEvents(buffer)
      for (const event of events) {
        yield event
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Start a streaming agent request.
 */
async function startStreamRequest(
  prompt: string,
  context: string,
  threadId?: string,
  abortSignal?: AbortSignal,
): Promise<Response> {
  const response = await fetch(`${API_BASE}/api/agent/step/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      context,
      thread_id: threadId,
    }),
    signal: abortSignal,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `HTTP ${response.status}`)
  }

  return response
}

/**
 * Resume streaming after tool execution.
 */
async function resumeStreamRequest(
  threadId: string,
  toolResults: ToolResult[],
  abortSignal?: AbortSignal,
): Promise<Response> {
  const response = await fetch(`${API_BASE}/api/agent/step/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      thread_id: threadId,
      tool_results: toolResults,
    }),
    signal: abortSignal,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `HTTP ${response.status}`)
  }

  return response
}

/**
 * Run the streaming hybrid agent loop.
 *
 * Streams events from the backend, executes tool calls on the frontend,
 * and reconnects to stream results until completion.
 *
 * @param prompt - The user's message
 * @param song - The Song object for tool execution
 * @param options - Configuration options
 * @param options.threadId - Optional thread ID to continue an existing conversation
 * @param options.callbacks - Event callbacks
 * @param options.abortSignal - Signal to abort the operation
 */
export async function runAgentStreamLoop(
  prompt: string,
  song: Song,
  options?: {
    threadId?: string
    callbacks?: StreamingCallbacks
    abortSignal?: AbortSignal
  },
): Promise<AgentLoopResult> {
  const { threadId: existingThreadId, callbacks, abortSignal } = options ?? {}
  let threadId: string | null = existingThreadId ?? null
  let thinkingBuffer = ""

  const makeResult = (
    success: boolean,
    stopReason: AgentStopReason,
    message?: string,
  ): AgentLoopResult => {
    const result: AgentLoopResult = {
      success,
      stopReason,
      message,
      threadId: threadId ?? undefined,
    }
    callbacks?.onComplete?.(result)
    return result
  }

  try {
    // Serialize current song state for agent context
    const songState = serializeSongState(song)
    const context = formatSongStateForPrompt(songState)

    // Start stream (continue existing thread if threadId provided)
    let response = await startStreamRequest(
      prompt,
      context,
      threadId ?? undefined,
      abortSignal,
    )

    while (true) {
      if (abortSignal?.aborted) {
        throw new Error("Aborted")
      }

      let pendingToolCalls: ToolCall[] | null = null
      let finalMessage: string | null = null
      let hasError = false

      // Consume the stream
      for await (const event of consumeSSEStream(response, abortSignal)) {
        // Capture thread_id from any event
        if (event.thread_id) {
          threadId = event.thread_id
        }

        switch (event.type) {
          case "thinking":
            if (event.content) {
              thinkingBuffer += event.content
              callbacks?.onThinking?.(event.content)
            }
            break

          case "tool_calls":
            if (event.tool_calls && event.tool_calls.length > 0) {
              pendingToolCalls = event.tool_calls
              callbacks?.onToolCalls?.(event.tool_calls)
            }
            break

          case "tool_results_received":
            // Tool results acknowledged by backend
            break

          case "message":
            if (event.content) {
              finalMessage = event.content
              callbacks?.onMessage?.(event.content)
            }
            if (event.done) {
              return makeResult(true, "complete", finalMessage ?? undefined)
            }
            break

          case "error":
            hasError = true
            const error = new Error(event.error ?? "Unknown error")
            callbacks?.onError?.(error)
            return makeResult(false, "error", event.error)
        }
      }

      // Stream ended - check what to do next
      if (hasError) {
        return makeResult(false, "error", "Stream error")
      }

      if (pendingToolCalls && pendingToolCalls.length > 0 && threadId) {
        // Execute all tool calls
        const toolResults = executeToolCalls(song, pendingToolCalls)
        callbacks?.onToolsExecuted?.(pendingToolCalls, toolResults)

        // Reset thinking buffer for next round
        thinkingBuffer = ""

        // Resume with tool results
        response = await resumeStreamRequest(threadId, toolResults, abortSignal)
        continue
      }

      // No more work to do
      if (finalMessage) {
        return makeResult(true, "complete", finalMessage)
      }

      // Unexpected end - return thinking buffer as fallback message
      return makeResult(true, "complete", thinkingBuffer || undefined)
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    if (err.message === "Aborted") {
      return makeResult(false, "aborted", "Aborted by user")
    }
    callbacks?.onError?.(err)
    return makeResult(false, "error", err.message)
  }
}
