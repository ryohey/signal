import { useState, useCallback, useRef, useEffect, FC } from "react"
import styled from "@emotion/styled"
import { aiBackend } from "../../services/aiBackend"
import { useLoadAISong } from "../../actions/aiGeneration"

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

export const AIChat: FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking")
  const loadAISong = useLoadAISong()
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const response = await aiBackend.generate({ prompt: userMessage })

      // Load the generated song
      loadAISong(response)

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Generated ${response.tracks.length} tracks: ${response.tracks.map((t) => t.name).join(", ")}. Press play to listen!`,
        },
      ])
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
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: friendlyMessage,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, loadAISong])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  return (
    <Container>
      <Header>
        <span>AI Composer</span>
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
        {isLoading && (
          <Message role="assistant">
            Generating your song... This may take 30-60 seconds.
          </Message>
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
        <Button
          onClick={handleSubmit}
          disabled={
            isLoading || !input.trim() || backendStatus === "disconnected"
          }
        >
          {isLoading ? "Generating..." : "Generate Song"}
        </Button>
      </InputContainer>
    </Container>
  )
}
