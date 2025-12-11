import styled from "@emotion/styled"
import { FC, useCallback, useEffect, useRef, useState } from "react"
import { useLoadAISong } from "../../actions/aiGeneration"
import { aiBackend } from "../../services/aiBackend"

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

interface ChatMessage {
  role: "user" | "assistant" | "error"
  content: string
}

const AGENT_TYPE_STORAGE_KEY = "ai_chat_agent_type"

export const AIChat: FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking")
  const [agentType, setAgentType] = useState<"llm" | "composition_agent">(() => {
    // Load from localStorage or default to composition_agent
    const stored = localStorage.getItem(AGENT_TYPE_STORAGE_KEY)
    return (stored === "llm" || stored === "composition_agent") 
      ? stored 
      : "composition_agent"
  })
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
    
    // Create abort controller for this request
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
  }, [input, isLoading, loadAISong, agentType])

  const handleInterrupt = useCallback(() => {
    if (abortControllerRef.current) {
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
    }
  }, [])

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
    const newAgentType = e.target.value as "llm" | "composition_agent"
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
