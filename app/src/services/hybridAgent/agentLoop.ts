/**
 * Hybrid agent loop - communicates with backend and executes tools on frontend.
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

interface AgentStepResponse {
  thread_id: string
  tool_calls: ToolCall[]
  done: boolean
  message: string | null
}

interface AgentLoopCallbacks {
  onToolsExecuted?: (toolCalls: ToolCall[], results: ToolResult[]) => void
  onMessage?: (message: string) => void
  onError?: (error: Error) => void
}

/**
 * Run the hybrid agent loop.
 *
 * Sends prompt to backend, executes returned tool calls on the song store,
 * and continues until the agent is done.
 */
export async function runAgentLoop(
  prompt: string,
  song: Song,
  callbacks?: AgentLoopCallbacks,
  abortSignal?: AbortSignal,
): Promise<{ success: boolean; message?: string }> {
  let threadId: string | null = null

  try {
    // Serialize current song state for agent context
    const songState = serializeSongState(song)
    const context = formatSongStateForPrompt(songState)
    console.log(`[HybridAgent] Song context:`, context)

    // Initial request
    let response = await fetch(`${API_BASE}/api/agent/step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, context }),
      signal: abortSignal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP ${response.status}`)
    }

    let result: AgentStepResponse = await response.json()
    threadId = result.thread_id
    console.log(`[HybridAgent] Initial response:`, result)

    // Agent loop
    while (!result.done) {
      if (abortSignal?.aborted) {
        throw new Error("Aborted")
      }

      if (result.tool_calls.length === 0) {
        console.log(`[HybridAgent] No tool calls but not done - breaking`)
        break
      }

      console.log(
        `[HybridAgent] Executing ${result.tool_calls.length} tool calls`,
      )
      // Execute tools on the frontend
      const toolResults = executeToolCalls(song, result.tool_calls)
      console.log(`[HybridAgent] Tool results:`, toolResults)
      callbacks?.onToolsExecuted?.(result.tool_calls, toolResults)

      // Resume the agent with tool results
      response = await fetch(`${API_BASE}/api/agent/step`, {
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

      result = await response.json()
    }

    // Agent completed
    if (result.message) {
      callbacks?.onMessage?.(result.message)
    }

    return { success: true, message: result.message ?? undefined }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    callbacks?.onError?.(err)
    return { success: false, message: err.message }
  }
}
