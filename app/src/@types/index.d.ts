declare module "*.png"
declare module "*.svg"

interface Window {
  webkitAudioContext: typeof AudioContext
}

// Type declarations for dynamically imported modules
declare module "@langchain/openai" {
  export class ChatOpenAI {
    constructor(config: {
      modelName: string
      configuration: {
        baseURL: string
        apiKey: string
      }
    })
  }
}

declare module "@langchain/core/tools" {
  export class DynamicStructuredTool {
    constructor(config: {
      name: string
      description: string
      schema: unknown
      func: (...args: unknown[]) => unknown
    })
  }
}

declare module "deepagents" {
  export function createDeepAgent(config: {
    model: unknown
    tools: unknown[]
    systemPrompt: string
  }): {
    stream: (
      input: { messages: Array<{ role: string; content: string }> },
      options?: { recursionLimit?: number },
    ) => AsyncIterable<unknown>
  }
}
