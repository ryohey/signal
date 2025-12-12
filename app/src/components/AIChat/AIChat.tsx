import styled from "@emotion/styled"
import { FC, useCallback, useEffect, useRef, useState } from "react"
import { useLoadAISong } from "../../actions/aiGeneration"
import { aiBackend, GenerationStage } from "../../services/aiBackend"
import type { ProgressEvent } from "../../services/aiBackend/types"
import { runAgentLoop, type ToolCall, type ToolResult } from "../../services/hybridAgent"
import { useStores } from "../../hooks/useStores"

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${({ theme }) => theme.backgroundColor};
  border-left: 1px solid ${({ theme }) => theme.dividerColor};
  min-width: 300px;
`

const Header = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.dividerColor};
  font-weight: 600;
  color: ${({ theme }) => theme.textColor};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`

const Select = styled.select`
  padding: 0.375rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.dividerColor};
  border-radius: 0.375rem;
  background: ${({ theme }) => theme.secondaryBackgroundColor};
  color: ${({ theme }) => theme.textColor};
  font-size: 0.75rem;
  font-family: inherit;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.themeColor};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const StatusDot = styled.span<{ status: "connected" | "disconnected" | "checking" }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ status }) =>
    status === "connected"
      ? "#4caf50"
      : status === "disconnected"
        ? "#f44336"
        : "#ff9800"};
`

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  user-select: text;
`

const Message = styled.div<{ role: "user" | "assistant" | "error" }>`
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  max-width: 85%;
  align-self: ${({ role }) => (role === "user" ? "flex-end" : "flex-start")};
  background: ${({ role, theme }) =>
    role === "user"
      ? theme.themeColor
      : role === "error"
        ? theme.redColor
        : theme.secondaryBackgroundColor};
  color: ${({ role, theme }) =>
    role === "user" || role === "error" ? theme.onSurfaceColor : theme.textColor};
  font-size: 0.875rem;
  line-height: 1.4;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  white-space: pre-wrap;
  word-wrap: break-word;
  cursor: text;
`

const InputContainer = styled.div`
  padding: 1rem;
  border-top: 1px solid ${({ theme }) => theme.dividerColor};
`

const Input = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.dividerColor};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.secondaryBackgroundColor};
  color: ${({ theme }) => theme.textColor};
  resize: none;
  font-family: inherit;
  font-size: 0.875rem;
  min-height: 80px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.themeColor};
  }

  &:disabled {
    opacity: 0.5;
  }

  &::placeholder {
    color: ${({ theme }) => theme.secondaryTextColor};
  }
`

const Button = styled.button`
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.themeColor};
  color: ${({ theme }) => theme.onSurfaceColor};
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const InterruptButton = styled.button`
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.redColor || "#f44336"};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.redColor || "#f44336"};
  color: white;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;

  &:hover {
    opacity: 0.9;
  }
`

const WarningBanner = styled.div`
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.yellowColor || "#ffc107"};
  color: #000;
  font-size: 0.8rem;
  text-align: center;
`

// Progress indicator styled components
const ProgressContainer = styled.div`
  padding: 0.75rem 1rem;
  background: ${({ theme }) => theme.secondaryBackgroundColor};
  border-radius: 0.5rem;
  margin: 0.5rem 0;
`

const ProgressStage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`

const StageIcon = styled.span`
  font-size: 1rem;
`

const StageName = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.textColor};
  font-size: 0.875rem;
`

const AttemptBadge = styled.span`
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: ${({ theme }) => theme.backgroundColor};
  border-radius: 0.75rem;
  color: ${({ theme }) => theme.secondaryTextColor};
`

const ProgressMessage = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.secondaryTextColor};
  margin-bottom: 0.5rem;
  user-select: text;
  cursor: text;
`

const ProgressBar = styled.div`
  height: 4px;
  background: ${({ theme }) => theme.backgroundColor};
  border-radius: 2px;
  overflow: hidden;
`

const ProgressFill = styled.div<{ width: number }>`
  height: 100%;
  background: ${({ theme }) => theme.themeColor};
  transition: width 0.3s ease;
  width: ${({ width }) => width}%;
`

// Helper functions for progress display
function getStageIcon(stage: GenerationStage): string {
  switch (stage) {
    case "planning":
      return "📝"
    case "generating":
      return "🎵"
    case "executing":
      return "⚙️"
    case "validating":
      return "✅"
    case "refining":
      return "🔧"
    case "complete":
      return "🎉"
    case "error":
      return "❌"
    default:
      return "⏳"
  }
}

function getStageLabel(stage: GenerationStage): string {
  switch (stage) {
    case "planning":
      return "Planning song structure..."
    case "generating":
      return "Generating music code..."
    case "executing":
      return "Creating MIDI files..."
    case "validating":
      return "Checking quality..."
    case "refining":
      return "Improving output..."
    case "complete":
      return "Complete!"
    case "error":
      return "Error"
    default:
      return "Processing..."
  }
}

function getStageProgress(stage: GenerationStage): number {
  switch (stage) {
    case "planning":
      return 15
    case "generating":
      return 40
    case "executing":
      return 60
    case "validating":
      return 80
    case "refining":
      return 70 // Goes back during refinement
    case "complete":
      return 100
    default:
      return 0
  }
}

interface ChatMessage {
  role: "user" | "assistant" | "error"
  content: string
}

const AGENT_TYPE_STORAGE_KEY = "ai_chat_agent_type"

type AgentType = "llm" | "composition_agent" | "hybrid"

export const AIChat: FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking")
  const [agentType, setAgentType] = useState<AgentType>(() => {
    // Load from localStorage or default to hybrid
    const stored = localStorage.getItem(AGENT_TYPE_STORAGE_KEY)
    return (stored === "llm" || stored === "composition_agent" || stored === "hybrid")
      ? stored as AgentType
      : "hybrid"
  })
  const { songStore } = useStores()
  // Deep agent progress state
  const [generationStage, setGenerationStage] = useState<GenerationStage | null>(null)
  const [generationProgress, setGenerationProgress] = useState<string>("")
  const [currentAttempt, setCurrentAttempt] = useState<number>(0)

  const loadAISong = useLoadAISong()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const streamingMessageRef = useRef<number>(-1)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Check backend health on mount and periodically
  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await aiBackend.healthCheck()
      setBackendStatus(isHealthy ? "connected" : "disconnected")
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Check every 30s
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    
    // Add user message and create placeholder for assistant response
    setMessages((prev) => {
      const newMessages = [...prev, { role: "user" as const, content: userMessage }]
      const assistantIndex = newMessages.length
      streamingMessageRef.current = assistantIndex
      return [...newMessages, { role: "assistant" as const, content: "" }]
    })
    
    setIsLoading(true)

    // Branch based on agent type
    if (agentType === "hybrid") {
      // Hybrid Agent mode: Run agent loop with frontend tool execution
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        const result = await runAgentLoop(
          userMessage,
          songStore.song,
          {
            onToolsExecuted: (toolCalls: ToolCall[], results: ToolResult[]) => {
              // Update message to show tools executed
              setMessages((prev) => {
                const updated = [...prev]
                const index = streamingMessageRef.current
                if (index >= 0 && index < updated.length) {
                  const toolNames = toolCalls.map((tc) => tc.name).join(", ")
                  updated[index] = {
                    ...updated[index],
                    content: updated[index].content + `\n🔧 Executed: ${toolNames}`,
                  }
                }
                return updated
              })
            },
            onMessage: (message: string) => {
              setMessages((prev) => {
                const updated = [...prev]
                const index = streamingMessageRef.current
                if (index >= 0 && index < updated.length) {
                  updated[index] = {
                    ...updated[index],
                    content: updated[index].content + `\n\n${message}`,
                  }
                }
                return updated
              })
            },
            onError: (error: Error) => {
              setMessages((prev) => {
                const updated = [...prev]
                const index = streamingMessageRef.current
                if (index >= 0 && index < updated.length) {
                  updated[index] = {
                    role: "error",
                    content: error.message,
                  }
                }
                return updated
              })
            },
          },
          abortController.signal
        )

        if (result.success) {
          setMessages((prev) => {
            const updated = [...prev]
            const index = streamingMessageRef.current
            if (index >= 0 && index < updated.length) {
              updated[index] = {
                role: "assistant",
                content: updated[index].content + "\n\n✅ Done! The changes have been applied to your song.",
              }
            }
            return updated
          })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Generation failed"
        setMessages((prev) => {
          const updated = [...prev]
          const index = streamingMessageRef.current
          if (index >= 0 && index < updated.length) {
            updated[index] = { role: "error", content: errorMessage }
          }
          return updated
        })
      } finally {
        streamingMessageRef.current = -1
        setIsLoading(false)
        abortControllerRef.current = null
      }
    } else if (agentType === "llm") {
      // LLM Direct mode: Use streaming with abort controller
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        await aiBackend.generateStream(
          { prompt: userMessage, agentType: agentType },
          (content: string) => {
            // Update the streaming message
            setMessages((prev) => {
              const updated = [...prev]
              const index = streamingMessageRef.current
              if (index >= 0 && index < updated.length) {
                updated[index] = {
                  ...updated[index],
                  content: updated[index].content + content,
                }
              }
              return updated
            })
          },
          (response) => {
            // Load the generated song
            loadAISong(response)

            // Update the final message
            setMessages((prev) => {
              const updated = [...prev]
              const index = streamingMessageRef.current
              if (index >= 0 && index < updated.length) {
                updated[index] = {
                  role: "assistant",
                  content:
                    prev[index].content +
                    `\n\n✅ Generated ${response.tracks.length} tracks: ${response.tracks.map((t) => t.name).join(", ")}. Press play to listen!`,
                }
              }
              return updated
            })
            streamingMessageRef.current = -1
            setIsLoading(false)
            abortControllerRef.current = null
          },
          (error) => {
            const errorMessage =
              error instanceof Error ? error.message : "Generation failed"

            // Provide user-friendly error messages
            let friendlyMessage = errorMessage
            if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
              friendlyMessage =
                "Cannot connect to AI backend. Make sure it's running on http://localhost:8000"
            } else if (errorMessage.includes("timeout")) {
              friendlyMessage =
                "Generation took too long. Try a simpler prompt or try again."
            } else if (errorMessage.includes("syntax error")) {
              friendlyMessage =
                "The AI generated invalid code. Please try again with a different prompt."
            }

            setMessages((prev) => {
              const updated = [...prev]
              const index = streamingMessageRef.current
              // Replace the streaming message with error
              if (index >= 0 && index < updated.length) {
                updated[index] = {
                  role: "error",
                  content: friendlyMessage,
                }
              }
              return updated
            })
            streamingMessageRef.current = -1
            setIsLoading(false)
            abortControllerRef.current = null
          },
          abortController.signal,
        )
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Generation failed"

        setMessages((prev) => {
          const updated = [...prev]
          const index = streamingMessageRef.current
          if (index >= 0 && index < updated.length) {
            updated[index] = {
              role: "error",
              content: errorMessage,
            }
          }
          return updated
        })
        streamingMessageRef.current = -1
        setIsLoading(false)
        abortControllerRef.current = null
      }
    } else {
      // Composition Agent mode: Use progress tracking
      setGenerationStage("planning")
      setGenerationProgress("Starting generation...")
      setCurrentAttempt(0)

      try {
        const response = await aiBackend.generateWithProgress(
          { prompt: userMessage, agentType: agentType },
          ((event: ProgressEvent) => {
            setGenerationStage(event.stage)
            setGenerationProgress(event.message || "")
            if (event.attempt) {
              setCurrentAttempt(event.attempt)
            }
          }) as Parameters<typeof aiBackend.generateWithProgress>[1],
        )

        // Load the generated song
        loadAISong(response)

        const attemptInfo =
          response.attemptLogs.length > 1
            ? ` (after ${response.attemptLogs.length} attempts)`
            : ""

        // Remove the placeholder message and add final result
        setMessages((prev) => {
          const updated = prev.slice(0, -1) // Remove placeholder
          return [
            ...updated,
            {
              role: "assistant",
              content: `Generated ${response.tracks.length} tracks: ${response.tracks.map((t: { name: string }) => t.name).join(", ")}${attemptInfo}. Press play to listen!`,
            },
          ]
        })
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Generation failed"

        // Provide user-friendly error messages
        let friendlyMessage = errorMessage
        if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
          friendlyMessage =
            "Cannot connect to AI backend. Make sure it's running on http://localhost:8000"
        } else if (errorMessage.includes("timeout")) {
          friendlyMessage =
            "Generation took too long. Try a simpler prompt or try again."
        } else if (errorMessage.includes("syntax error")) {
          friendlyMessage =
            "The AI generated invalid code. Please try again with a different prompt."
        } else if (errorMessage.includes("5 attempts")) {
          friendlyMessage =
            "Generation failed after multiple attempts. Try a different prompt or simpler request."
        }

        // Remove placeholder and add error message
        setMessages((prev) => {
          const updated = prev.slice(0, -1) // Remove placeholder
          return [
            ...updated,
            {
              role: "error",
              content: friendlyMessage,
            },
          ]
        })
      } finally {
        setIsLoading(false)
        setGenerationStage(null)
        setGenerationProgress("")
        streamingMessageRef.current = -1
      }
    }
  }, [input, isLoading, loadAISong, agentType])

  const handleInterrupt = useCallback(() => {
    if (abortControllerRef.current) {
      // LLM mode: abort the stream
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
      
      // Update the streaming message to indicate interruption
      setMessages((prev) => {
        const updated = [...prev]
        const index = streamingMessageRef.current
        if (index >= 0 && index < updated.length) {
          updated[index] = {
            role: "error",
            content: "Generation was interrupted by user.",
          }
        }
        return updated
      })
      streamingMessageRef.current = -1
    } else if (agentType === "composition_agent" && isLoading) {
      // Composition agent mode: just stop and clean up
      setIsLoading(false)
      setGenerationStage(null)
      setGenerationProgress("")
      setMessages((prev) => {
        const updated = prev.slice(0, -1) // Remove placeholder
        return [
          ...updated,
          {
            role: "error",
            content: "Generation was interrupted by user.",
          },
        ]
      })
      streamingMessageRef.current = -1
    }
  }, [agentType, isLoading])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  const handleAgentTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAgentType = e.target.value as AgentType
    setAgentType(newAgentType)
    localStorage.setItem(AGENT_TYPE_STORAGE_KEY, newAgentType)
  }, [])

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <span>AI Composer</span>
          <Select
            value={agentType}
            onChange={handleAgentTypeChange}
            disabled={isLoading}
            title="Select AI agent type"
          >
            <option value="hybrid">Hybrid Agent</option>
            <option value="composition_agent">Deep Agent</option>
            <option value="llm">LLM Direct</option>
          </Select>
        </HeaderLeft>
        <StatusDot
          status={backendStatus}
          title={
            backendStatus === "connected"
              ? "Backend connected"
              : backendStatus === "disconnected"
                ? "Backend not available"
                : "Checking connection..."
          }
        />
      </Header>
      {backendStatus === "disconnected" && (
        <WarningBanner>
          AI backend not available. Start it with: cd backend && uvicorn
          app.main:app --reload
        </WarningBanner>
      )}
      <MessageList>
        {messages.length === 0 && (
          <Message role="assistant">
            Describe your song idea! Try: &quot;Upbeat indie rock in Am, 120
            BPM&quot;
          </Message>
        )}
        {messages.map((msg, i) => (
          <Message key={i} role={msg.role}>
            {msg.content}
          </Message>
        ))}
        {/* Show progress UI only for composition_agent mode */}
        {isLoading && agentType === "composition_agent" && generationStage && (
          <ProgressContainer>
            <ProgressStage>
              <StageIcon>{getStageIcon(generationStage)}</StageIcon>
              <StageName>{getStageLabel(generationStage)}</StageName>
              {currentAttempt > 0 && (
                <AttemptBadge>Attempt {currentAttempt}/5</AttemptBadge>
              )}
            </ProgressStage>
            {generationProgress && (
              <ProgressMessage>{generationProgress}</ProgressMessage>
            )}
            <ProgressBar>
              <ProgressFill width={getStageProgress(generationStage)} />
            </ProgressBar>
          </ProgressContainer>
        )}
        <div ref={messagesEndRef} />
      </MessageList>
      <InputContainer>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your song..."
          disabled={isLoading || backendStatus === "disconnected"}
        />
        {isLoading ? (
          <InterruptButton onClick={handleInterrupt}>
            Stop Generation
          </InterruptButton>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={
              !input.trim() || backendStatus === "disconnected"
            }
          >
            Generate Song
          </Button>
        )}
      </InputContainer>
    </Container>
  )
}
