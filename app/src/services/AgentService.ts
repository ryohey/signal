/**
 * AgentService - Wrapper for DeepAgents library.
 * Provides streaming execution of the music composition agent.
 */

import type RootStore from "../stores/RootStore"

export interface StreamEvent {
  type: "thought" | "tool" | "plan" | "file"
  content: string
  timestamp: number
}

type EventCallback = (event: StreamEvent) => void

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Agent = any

export class AgentService {
  private agent: Agent = null
  private events: StreamEvent[] = []
  private onEvent: EventCallback

  constructor(
    private readonly rootStore: RootStore,
    onEvent: EventCallback = () => {},
  ) {
    this.onEvent = onEvent
  }

  /**
   * Lazy initialization of the DeepAgent instance.
   * Uses dynamic imports to avoid loading Node.js-only dependencies at startup.
   */
  private async getAgent(): Promise<Agent> {
    if (this.agent) {
      return this.agent
    }

    // @ts-expect-error - import.meta.env is provided by Vite at runtime
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string
    if (!apiKey) {
      throw new Error(
        "VITE_OPENROUTER_API_KEY not set. Add it to .env.local file.",
      )
    }

    // Dynamic imports to avoid loading Node.js dependencies at startup
    const [
      { ChatOpenAI },
      { DynamicStructuredTool },
      { createDeepAgent },
      { createToolDefinitions },
      { MUSIC_GENERATOR_PROMPT },
    ] = await Promise.all([
      import("@langchain/openai"),
      import("@langchain/core/tools"),
      import("deepagents"),
      import("../agent/tools"),
      import("../agent/systemPrompt"),
    ])

    // Create OpenRouter-compatible model
    const model = new ChatOpenAI({
      modelName: "anthropic/claude-sonnet-4",
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
      },
    })

    // Get tool definitions and convert to LangChain DynamicStructuredTools
    const song = this.rootStore.songStore.song
    const toolDefinitions = createToolDefinitions({ song })

    // @ts-expect-error - DynamicStructuredTool has deep type instantiation issues with Zod
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tools: any[] = toolDefinitions.map((def) => {
      // @ts-expect-error - Type instantiation too deep
      return new DynamicStructuredTool({
        name: def.name,
        description: def.description,
        schema: def.schema,
        func: def.func,
      })
    })

    // Create the agent
    this.agent = createDeepAgent({
      model,
      tools,
      systemPrompt: MUSIC_GENERATOR_PROMPT,
    })

    return this.agent
  }

  /**
   * Detect event type from a streaming chunk.
   */
  private detectEventType(
    chunk: unknown,
  ): "thought" | "tool" | "plan" | "file" {
    if (!chunk || typeof chunk !== "object") {
      return "thought"
    }

    const chunkObj = chunk as Record<string, unknown>

    // Check for tool calls
    if (chunkObj.name || chunkObj.tool) {
      const toolName = (chunkObj.name || chunkObj.tool) as string

      // Categorize by tool type
      if (toolName === "write_todos") {
        return "plan"
      }
      if (toolName === "write_file" || toolName === "read_file") {
        return "file"
      }
      return "tool"
    }

    // Check nested structures
    if (chunkObj.messages && Array.isArray(chunkObj.messages)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastMessage = chunkObj.messages[chunkObj.messages.length - 1] as any
      if (lastMessage?.tool_calls?.length > 0) {
        return "tool"
      }
    }

    return "thought"
  }

  /**
   * Extract readable content from a streaming chunk.
   */
  private extractContent(chunk: unknown): string {
    if (!chunk) {
      return ""
    }

    if (typeof chunk === "string") {
      return chunk
    }

    if (typeof chunk !== "object") {
      return String(chunk)
    }

    const chunkObj = chunk as Record<string, unknown>

    // Handle content field
    if (typeof chunkObj.content === "string") {
      return chunkObj.content
    }

    // Handle messages array (LangGraph format)
    if (chunkObj.messages && Array.isArray(chunkObj.messages)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastMessage = chunkObj.messages[chunkObj.messages.length - 1] as any
      if (lastMessage?.content) {
        return String(lastMessage.content)
      }
    }

    // Handle tool result
    if (chunkObj.output) {
      return String(chunkObj.output)
    }

    // Handle agent state updates
    if (chunkObj.agent) {
      const agentState = chunkObj.agent as Record<string, unknown>
      if (agentState.messages && Array.isArray(agentState.messages)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lastMsg = agentState.messages[agentState.messages.length - 1] as any
        if (lastMsg?.content) {
          return String(lastMsg.content)
        }
      }
    }

    return ""
  }

  /**
   * Add an event and notify callback.
   */
  private addEvent(type: StreamEvent["type"], content: string) {
    if (!content.trim()) {
      return
    }

    const event: StreamEvent = {
      type,
      content,
      timestamp: Date.now(),
    }

    this.events.push(event)
    this.onEvent(event)
  }

  /**
   * Main entry point - generates music based on user prompt.
   * Streams execution events via the callback.
   */
  async generate(prompt: string): Promise<void> {
    const agent = await this.getAgent()

    try {
      // Stream the agent execution
      const stream = await agent.stream(
        { messages: [{ role: "user", content: prompt }] },
        { recursionLimit: 50 },
      )

      for await (const chunk of stream) {
        const eventType = this.detectEventType(chunk)
        const content = this.extractContent(chunk)

        if (content) {
          this.addEvent(eventType, content)
        }

        // Log for debugging (remove in production)
        console.log("[AgentService]", eventType, chunk)
      }
    } catch (error) {
      console.error("[AgentService] Generation error:", error)
      throw error
    }
  }

  /**
   * Get all collected events.
   */
  getEvents(): StreamEvent[] {
    return [...this.events]
  }

  /**
   * Clear event history.
   */
  clearHistory(): void {
    this.events = []
  }

  /**
   * Reset agent state (creates a fresh agent on next generate call).
   */
  resetAgent(): void {
    this.agent = null
    this.events = []
  }

  /**
   * Update the event callback.
   */
  setEventCallback(callback: EventCallback): void {
    this.onEvent = callback
  }
}
