import { keyframes } from "@emotion/react"
import styled from "@emotion/styled"
import { FC, useCallback, useEffect, useRef, useState } from "react"
import CloseIcon from "mdi-react/CloseIcon"
import { useLoadAISong } from "../../actions/aiGeneration"
import { useAIChat } from "../../hooks/useAIChat"
import { useRouter } from "../../hooks/useRouter"
import { useStores } from "../../hooks/useStores"
import { useSong } from "../../hooks/useSong"
import { useConductorTrack } from "../../hooks/useConductorTrack"
import { aiBackend, GenerationStage } from "../../services/aiBackend"
import type { ProgressEvent } from "../../services/aiBackend/types"
import { runAgentLoop, type ToolCall } from "../../services/hybridAgent"
import type { ToolResult } from "../../services/hybridAgent/toolExecutor"
import { processVoiceToMidi } from "../../services/voiceToMidi"
import { Tooltip } from "../ui/Tooltip"
import { VoiceRecorder, type DetectedNote } from "./VoiceRecorder"
import { emptyTrack } from "@signal-app/core"
import { getInstrumentProgramNumber } from "../../agent/instrumentMapping"

const Container = styled.div<{ standalone?: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background: ${({ theme }) => theme.backgroundColor};
  border-left: ${({ standalone, theme }) =>
    standalone ? "none" : `1px solid ${theme.dividerColor}`};
  overflow: hidden;
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
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  flex-shrink: 0;
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
`

const NewChatButton = styled.button`
  padding: 0.375rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  color: ${({ theme }) => theme.secondaryTextColor};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    color: ${({ theme }) => theme.textColor};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Select = styled.select`
  padding: 0.375rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  color: ${({ theme }) => theme.textColor};
  font-size: 0.75rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.themeColor};
    box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.15);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const StatusDot = styled.span<{
  status: "connected" | "disconnected" | "checking"
}>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 150ms;
  box-shadow: ${({ status }) =>
    status === "connected"
      ? "0 0 8px rgba(48, 209, 88, 0.6)"
      : status === "disconnected"
        ? "0 0 8px rgba(255, 69, 58, 0.6)"
        : "0 0 8px rgba(255, 214, 10, 0.6)"};
  background: ${({ status }) =>
    status === "connected"
      ? "#30d158"
      : status === "disconnected"
        ? "#ff453a"
        : "#ffd60a"};
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const CloseButton = styled.button`
  padding: 0.375rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  color: ${({ theme }) => theme.secondaryTextColor};
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    color: ${({ theme }) => theme.textColor};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  user-select: text;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
`

const Message = styled.div<{ role: "user" | "assistant" | "error" }>`
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  max-width: 85%;
  width: 85%;
  min-width: 0;
  align-self: ${({ role }) => (role === "user" ? "flex-end" : "flex-start")};
  background: ${({ role, theme }) =>
    role === "user"
      ? theme.themeColor
      : role === "error"
        ? "rgba(255, 69, 58, 0.15)"
        : theme.secondaryBackgroundColor};
  color: ${({ role, theme }) =>
    role === "user"
      ? theme.onSurfaceColor
      : role === "error"
        ? "#ff453a"
      : theme.textColor};
  font-size: 0.8125rem;
  line-height: 1.5;
  letter-spacing: -0.01em;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  cursor: text;
  box-sizing: border-box;
  border: 1px solid ${({ role, theme }) =>
    role === "user"
      ? "transparent"
      : role === "error"
        ? "rgba(255, 69, 58, 0.3)"
        : theme.dividerColor};
  animation: slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const InputContainer = styled.div`
  padding: 1rem;
  border-top: 1px solid ${({ theme }) => theme.dividerColor};
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
`

const InputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
`

const Input = styled.textarea`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  color: ${({ theme }) => theme.textColor};
  resize: none;
  font-family: inherit;
  font-size: 0.8125rem;
  line-height: 1.5;
  min-height: 80px;
  box-sizing: border-box;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.themeColor};
    box-shadow: 0 0 0 3px rgba(0, 212, 170, 0.15);
    background: rgba(255, 255, 255, 0.06);
  }

  &:disabled {
    opacity: 0.5;
  }

  &::placeholder {
    color: ${({ theme }) => theme.tertiaryTextColor};
  }
`

const Button = styled.button`
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.875rem;
  border: none;
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.themeColor};
  color: ${({ theme }) => theme.onSurfaceColor};
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
  letter-spacing: -0.01em;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 20px rgba(0, 212, 170, 0.3);

  &:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: 0 0 24px rgba(0, 212, 170, 0.5);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
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
  max-width: 85%;
  min-width: 0;
  width: fit-content;
  box-sizing: border-box;
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
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

// Notes display component
const NotesContainer = styled.div`
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: ${({ theme }) => theme.backgroundColor};
  border-radius: 0.375rem;
  border: 1px solid ${({ theme }) => theme.dividerColor};
  font-family: monospace;
  font-size: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
`

const NotesHeader = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.textColor};
  font-size: 0.8rem;
`

const NotesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

const NoteItem = styled.div`
  padding: 0.25rem 0.5rem;
  background: ${({ theme }) => theme.secondaryBackgroundColor};
  border-radius: 0.25rem;
  color: ${({ theme }) => theme.textColor};
`

const VoiceProcessingIndicator = styled.div`
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.secondaryBackgroundColor};
  border-radius: 0.5rem;
  color: ${({ theme }) => theme.secondaryTextColor};
  font-size: 0.8rem;
  text-align: center;
`

const NotesDisplay: FC<{ notes: DetectedNote[] }> = ({ notes }) => {
  // Convert MIDI note number to note name
  const midiNoteToName = (midiNote: number): string => {
    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ]
    const octave = Math.floor(midiNote / 12) - 1
    const noteName = noteNames[midiNote % 12]
    return `${noteName}${octave}`
  }

  return (
    <NotesContainer>
      <NotesHeader>Detected Notes ({notes.length}):</NotesHeader>
      <NotesList>
        {notes.map((note, i) => (
          <NoteItem key={i}>
            {midiNoteToName(note.pitch)} - pitch: {note.pitch}, start:{" "}
            {note.start} ticks, duration: {note.duration} ticks, velocity:{" "}
            {note.velocity}
          </NoteItem>
        ))}
      </NotesList>
      <div
        style={{
          marginTop: "0.5rem",
          fontSize: "0.7rem",
          color: "rgba(255,255,255,0.6)",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
          addNotes tool format:
        </div>
        <div
          style={{
            background: "rgba(0,0,0,0.2)",
            padding: "0.5rem",
            borderRadius: "0.25rem",
            overflowX: "auto",
          }}
        >
          {JSON.stringify(
            {
              trackId: 0, // User will specify track
              notes: notes.map((n) => ({
                pitch: n.pitch,
                start: n.start,
                duration: n.duration,
                velocity: n.velocity,
              })),
            },
            null,
            2,
          )}
        </div>
      </div>
    </NotesContainer>
  )
}

// Music-themed loading indicator
const MUSIC_LOADING_WORDS = [
  "Harmonizing",
  "Composing",
  "Orchestrating",
  "Arranging",
  "Improvising",
  "Transposing",
  "Syncopating",
  "Modulating",
  "Arpeggiating",
  "Crescendoing",
  "Cadencing",
  "Voicing",
  "Layering",
  "Grooving",
  "Jamming",
  "Riffing",
  "Mixing",
  "Sequencing",
  "Quantizing",
  "Looping",
]

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.02);
    opacity: 0.9;
  }
`

const noteFloat = keyframes`
  0%, 100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-3px) rotate(5deg);
  }
`

const MusicLoadingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.secondaryBackgroundColor} 0%,
    rgba(0, 212, 170, 0.08) 100%
  );
  border-radius: 0.75rem;
  max-width: 85%;
  border: 1px solid rgba(0, 212, 170, 0.2);
  animation: ${pulse} 2s ease-in-out infinite;
`

const MusicIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.themeColor} 0%, #00a878 100%);
  box-shadow: 0 0 12px rgba(0, 212, 170, 0.4);
  animation: ${noteFloat} 1.5s ease-in-out infinite;

  svg {
    width: 1.125rem;
    height: 1.125rem;
    fill: white;
  }
`

const LoadingText = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.textColor};
  letter-spacing: -0.01em;
`

const MusicLoadingIndicator: FC = () => {
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % MUSIC_LOADING_WORDS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <MusicLoadingContainer>
      <MusicIcon>
        <svg viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </MusicIcon>
      <LoadingText>{MUSIC_LOADING_WORDS[wordIndex]}...</LoadingText>
    </MusicLoadingContainer>
  )
}

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

const AGENT_TYPE_STORAGE_KEY = "ai_chat_agent_type"

type AgentType = "llm" | "composition_agent" | "hybrid"

const KEY_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
]

function getKeyDisplayName(key: number, scale: "major" | "minor"): string {
  return `${KEY_NAMES[key]} ${scale}`
}

export interface AIChatProps {
  standalone?: boolean
}

export const AIChat: FC<AIChatProps> = ({ standalone = false }) => {
  const {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    generationStage,
    setGenerationStage,
    generationProgress,
    setGenerationProgress,
    currentAttempt,
    setCurrentAttempt,
    activeThreadId,
    setActiveThreadId,
  } = useAIChat()
  const [input, setInput] = useState("")
  const [backendStatus, setBackendStatus] = useState<
    "connected" | "disconnected" | "checking"
  >("checking")
  const [agentType, setAgentType] = useState<AgentType>(() => {
    // Load from localStorage or default to hybrid
    const stored = localStorage.getItem(AGENT_TYPE_STORAGE_KEY)
    return stored === "llm" ||
      stored === "composition_agent" ||
      stored === "hybrid"
      ? (stored as AgentType)
      : "hybrid" // Default to hybrid agent
  })
  const [voiceProcessing, setVoiceProcessing] = useState(false)
  const [voiceProgress, setVoiceProgress] = useState("")
  const { songStore } = useStores()
  const { addTrack, tracks, timebase } = useSong()
  const { currentTempo } = useConductorTrack()

  const loadAISong = useLoadAISong()
  const { setPath } = useRouter()
  const { setOpen: setAIChatOpen } = useAIChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  // Use a ref to track the streaming message index - this allows callbacks to
  // access the current value at execution time rather than definition time
  const streamingMessageIndexRef = useRef<number>(-1)
  // Track if we've navigated to arrange view for this generation session
  const hasNavigatedRef = useRef<boolean>(false)

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

  const handleSubmit = useCallback(
    async (overrideInput?: string) => {
      const messageToSubmit = overrideInput || input.trim()
      if (!messageToSubmit) return

      if (isLoading) return

      // Find if there are notes in recent messages that should be included as context
      const recentMessageWithNotes = messages
        .slice()
        .reverse()
        .find((msg) => msg.role === "user" && msg.notes && msg.notes.length > 0)

      let userMessage = messageToSubmit

      // If there are notes in a recent message, include them in the exact addNotes tool format
      if (recentMessageWithNotes?.notes) {
        const notesData = {
          trackId: 0, // User will specify which track
          notes: recentMessageWithNotes.notes.map((n) => ({
            pitch: n.pitch,
            start: n.start,
            duration: n.duration,
            velocity: n.velocity,
          })),
        }
        const notesJson = JSON.stringify(notesData, null, 2)
        userMessage = `${messageToSubmit}\n\nHere are the notes to add (in addNotes tool format):\n\`\`\`json\n${notesJson}\n\`\`\``
      }

      if (!overrideInput) {
        setInput("")
      }

      // Add user message and create placeholder for assistant response
      setMessages((prev) => {
        const newMessages = [
          ...prev,
          { role: "user" as const, content: messageToSubmit },
        ]
        const assistantIndex = newMessages.length
        streamingMessageIndexRef.current = assistantIndex
        return [...newMessages, { role: "assistant" as const, content: "" }]
      })

      // Reset navigation flag for this generation session
      hasNavigatedRef.current = false
      setAIChatOpen(true)

      setIsLoading(true)

      // Branch based on agent type
      if (agentType === "hybrid") {
        // Hybrid Agent mode: Run agent loop with frontend tool execution
        const abortController = new AbortController()
        abortControllerRef.current = abortController

        console.log(`[AIChat] handleSubmit - activeThreadId: ${activeThreadId}`)

        try {
          const result = await runAgentLoop(userMessage, songStore.song, {
            threadId: activeThreadId ?? undefined,
            abortSignal: abortController.signal,
            callbacks: {
              onToolsExecuted: (
                toolCalls: ToolCall[],
                results: ToolResult[],
              ) => {
                // Navigate to arrange view when tools are actually executed (generation has started)
                if (!hasNavigatedRef.current) {
                  setPath("/arrange")
                  hasNavigatedRef.current = true
                }
                // Capture index BEFORE setMessages to avoid race with finally block
                const index = streamingMessageIndexRef.current
                // Update message to show tools executed
                setMessages((prev) => {
                  const updated = [...prev]
                  if (index >= 0 && index < updated.length) {
                    const toolNames = toolCalls.map((tc) => tc.name).join(", ")
                    const successCount = results.filter((r) => {
                      try {
                        const parsed = JSON.parse(r.result)
                        return !parsed.error
                      } catch {
                        return true
                      }
                    }).length
                    updated[index] = {
                      ...updated[index],
                      content:
                        updated[index].content +
                        `\n🔧 Executed: ${toolNames} (${successCount}/${results.length} succeeded)`,
                    }
                  }
                  return updated
                })
              },
              onMessage: (message: string) => {
                // Capture index BEFORE setMessages to avoid race with finally block
                const index = streamingMessageIndexRef.current
                // Display the agent's response message
                setMessages((prev) => {
                  const updated = [...prev]
                  if (index >= 0 && index < updated.length) {
                    updated[index] = {
                      ...updated[index],
                      content: updated[index].content
                        ? updated[index].content + `\n\n${message}`
                        : message,
                    }
                  }
                  return updated
                })
              },
              onError: (error: Error) => {
                // Capture index BEFORE setMessages to avoid race with finally block
                const index = streamingMessageIndexRef.current
                console.error("[AIChat] Agent error:", error)
                setMessages((prev) => {
                  const updated = [...prev]
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
          })

          // Save thread ID for multi-turn conversation
          if (result.threadId) {
            setActiveThreadId(result.threadId)
          }

          // Handle error result
          if (!result.success) {
            const index = streamingMessageIndexRef.current
            setMessages((prev) => {
              const updated = [...prev]
              if (index >= 0 && index < updated.length) {
                updated[index] = {
                  role: "error",
                  content: result.message || "An error occurred",
                }
              }
              return updated
            })
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Generation failed"
          const index = streamingMessageIndexRef.current
          setMessages((prev) => {
            const updated = [...prev]
            if (index >= 0 && index < updated.length) {
              updated[index] = { role: "error", content: errorMessage }
            }
            return updated
          })
        } finally {
          streamingMessageIndexRef.current = -1
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
              // Navigate to arrange view when first content is received (generation has started)
              if (!hasNavigatedRef.current && content.trim().length > 0) {
                setPath("/arrange")
                hasNavigatedRef.current = true
              }
              // Capture index from ref BEFORE setMessages
              const index = streamingMessageIndexRef.current
              // Update the streaming message
              setMessages((prev) => {
                const updated = [...prev]
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

              // Capture index from ref BEFORE setMessages
              const index = streamingMessageIndexRef.current
              // Update the final message
              setMessages((prev) => {
                const updated = [...prev]
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
              streamingMessageIndexRef.current = -1
              setIsLoading(false)
              abortControllerRef.current = null
            },
            (error) => {
              const errorMessage =
                error instanceof Error ? error.message : "Generation failed"
              console.error("[AIChat] LLM generation error:", error)

              // Provide user-friendly error messages
              let friendlyMessage = errorMessage
              if (
                errorMessage.includes("fetch") ||
                errorMessage.includes("network")
              ) {
                friendlyMessage =
                  "Cannot connect to AI backend. Make sure it's running on http://localhost:8000"
              } else if (errorMessage.includes("timeout")) {
                friendlyMessage =
                  "Generation took too long. Try a simpler prompt or try again."
              } else if (errorMessage.includes("syntax error")) {
                friendlyMessage =
                  "The AI generated invalid code. Please try again with a different prompt."
              }

              // Capture index from ref BEFORE setMessages
              const index = streamingMessageIndexRef.current
              setMessages((prev) => {
                const updated = [...prev]
                // Replace the streaming message with error
                if (index >= 0 && index < updated.length) {
                  updated[index] = {
                    role: "error",
                    content: friendlyMessage,
                  }
                }
                return updated
              })
              streamingMessageIndexRef.current = -1
              setIsLoading(false)
              abortControllerRef.current = null
            },
            abortController.signal,
          )
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Generation failed"
          console.error("[AIChat] LLM catch error:", err)

          // Capture index from ref BEFORE setMessages
          const index = streamingMessageIndexRef.current
          setMessages((prev) => {
            const updated = [...prev]
            if (index >= 0 && index < updated.length) {
              updated[index] = {
                role: "error",
                content: errorMessage,
              }
            }
            return updated
          })
          streamingMessageIndexRef.current = -1
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
              // Navigate to arrange view when progress callback is first called (generation has started)
              if (!hasNavigatedRef.current) {
                setPath("/arrange")
                hasNavigatedRef.current = true
              }
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
          console.error("[AIChat] Composition agent error:", err)

          // Provide user-friendly error messages
          let friendlyMessage = errorMessage
          if (
            errorMessage.includes("fetch") ||
            errorMessage.includes("network")
          ) {
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
        }
      }
    },
    [
      input,
      isLoading,
      loadAISong,
      agentType,
      songStore.song,
      messages,
      activeThreadId,
      setMessages,
      setIsLoading,
      setGenerationStage,
      setGenerationProgress,
      setCurrentAttempt,
      setPath,
      setAIChatOpen,
    ],
  )

  const handleInterrupt = useCallback(() => {
    if (abortControllerRef.current) {
      // Abort the stream (works for both LLM and hybrid modes)
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
      setActiveThreadId(null)

      // Update the streaming message to indicate interruption
      // Capture index from ref BEFORE setMessages
      const index = streamingMessageIndexRef.current
      setMessages((prev) => {
        const updated = [...prev]
        if (index >= 0 && index < updated.length) {
          updated[index] = {
            role: "error",
            content: "Generation was interrupted by user.",
          }
        }
        return updated
      })
      streamingMessageIndexRef.current = -1
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
      streamingMessageIndexRef.current = -1
    }
  }, [
    agentType,
    isLoading,
    setMessages,
    setIsLoading,
    setGenerationStage,
    setGenerationProgress,
  ])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit],
  )

  const handleAgentTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newAgentType = e.target.value as AgentType
      setAgentType(newAgentType)
      localStorage.setItem(AGENT_TYPE_STORAGE_KEY, newAgentType)
    },
    [],
  )

  const handleNewChat = useCallback(() => {
    setActiveThreadId(null)
    setMessages([])
  }, [setMessages])

  // Handle notes detected from voice recorder (fallback)
  const handleNotesDetected = useCallback(
    (notes: DetectedNote[]) => {
      if (notes.length === 0) return

      // Add a message to the chat with the notes displayed
      const messageContent = `Recorded ${notes.length} notes. Specify which track to add them to, or ask me to create a new track.`

      setMessages((prev) => [
        ...prev,
        {
          role: "user" as const,
          content: messageContent,
          notes: notes, // Store notes in the message for display and context
        },
      ])
    },
    [setMessages],
  )

  // Handle audio captured from voice recorder (CREPE processing)
  const handleAudioCaptured = useCallback(
    async (audioBlob: Blob, fallbackNotes: DetectedNote[]) => {
      if (voiceProcessing) return

      setVoiceProcessing(true)
      setVoiceProgress("Starting pitch detection...")

      try {
        // TODO: Get key signature from song state if available
        const keyHint: number | undefined = undefined
        const scaleHint: "major" | "minor" | undefined = undefined

        // Process through CREPE + LLM pipeline
        const result = await processVoiceToMidi(audioBlob, {
          quantizeValue: 8,
          timebase: timebase,
          projectTempo: currentTempo ?? 120,
          onProgress: (stage, _progress) => {
            setVoiceProgress(stage)
          },
          keyHint,
          scaleHint,
        })

        if (result.notes.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "error" as const,
              content:
                "No melody detected. Try humming or singing more clearly, or move closer to the microphone.",
            },
          ])
          return
        }

        // Create a new track with the detected notes
        const leadInfo = getInstrumentProgramNumber("lead")
        const channel = tracks.length < 9 ? tracks.length - 1 : tracks.length
        const newTrack = emptyTrack(channel)
        newTrack.setName("Voice Melody")
        if (leadInfo) {
          newTrack.setProgramNumber(leadInfo.programNumber)
        }

        // Convert interpreted notes to MIDI events
        const noteEvents = result.notes.map((note) => ({
          type: "channel" as const,
          subtype: "note" as const,
          noteNumber: note.note_number,
          tick: note.tick,
          duration: note.duration,
          velocity: note.velocity,
        }))
        newTrack.addEvents(noteEvents)
        addTrack(newTrack)

        // Build success message with key, tempo, and pitch offset info
        const noteCount = result.notes.length
        const keyName = getKeyDisplayName(
          result.detectedKey,
          result.detectedScale as "major" | "minor",
        )

        let keyInfo = ""
        if (result.keySource === "user_provided") {
          keyInfo = `Using your song's key: ${keyName}.`
        } else if (result.keySource === "detected_confident") {
          keyInfo = `Detected key: ${keyName} (high confidence).`
        } else {
          keyInfo = `Detected key: ${keyName} (low confidence - you may want to adjust notes).`
        }

        let offsetInfo = ""
        if (Math.abs(result.pitchOffsetCents) > 10) {
          const direction = result.pitchOffsetCents < 0 ? "flat" : "sharp"
          offsetInfo = ` Your pitch was ${Math.abs(result.pitchOffsetCents).toFixed(0)} cents ${direction} overall - I've corrected for this.`
        }

        const tempoInfo =
          result.tempoConfidence === "high"
            ? `Detected tempo: ${result.detectedTempo.toFixed(0)} BPM.`
            : ""

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant" as const,
            content: `✅ Created "Voice Melody" track with ${noteCount} notes! ${keyInfo}${offsetInfo}${tempoInfo ? ` ${tempoInfo}` : ""}\n\nYou can now ask me to generate accompaniment around your melody.`,
          },
        ])

        // Navigate to arrange view
        setPath("/arrange")
      } catch (error) {
        console.error("Voice-to-MIDI error:", error)
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"

        if (fallbackNotes.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "error" as const,
              content: `CREPE processing failed: ${errorMessage}. Using browser pitch detection instead.`,
            },
          ])
          handleNotesDetected(fallbackNotes)
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "error" as const,
              content: `Voice processing failed: ${errorMessage}`,
            },
          ])
        }
      } finally {
        setVoiceProcessing(false)
        setVoiceProgress("")
      }
    },
    [
      voiceProcessing,
      timebase,
      currentTempo,
      tracks,
      addTrack,
      setMessages,
      setPath,
      handleNotesDetected,
    ],
  )

  return (
    <Container standalone={standalone}>
      <Header>
        <HeaderLeft>
          <span>AI Composer</span>
          <Tooltip title="Choose generation method">
          <Select
            value={agentType}
            onChange={handleAgentTypeChange}
            disabled={isLoading}
          >
            <option value="hybrid">Hybrid Agent</option>
            <option value="composition_agent">Deep Agent</option>
            <option value="llm">LLM Direct</option>
          </Select>
          </Tooltip>
        </HeaderLeft>
        {activeThreadId && (
          <Tooltip title="Start fresh conversation">
            <NewChatButton onClick={handleNewChat} disabled={isLoading}>
            New Chat
          </NewChatButton>
          </Tooltip>
        )}
        <HeaderRight>
          <Tooltip
            title={
              backendStatus === "connected"
                ? "Backend connected"
                : backendStatus === "disconnected"
                  ? "Backend not available"
                  : "Checking connection..."
            }
          >
            <StatusDot status={backendStatus} />
          </Tooltip>
          {!standalone && (
            <Tooltip title="Collapse chat">
              <CloseButton onClick={() => setAIChatOpen(false)} disabled={isLoading}>
                <CloseIcon size={16} />
              </CloseButton>
            </Tooltip>
          )}
        </HeaderRight>
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
        {messages.map((msg, i) => {
          // Skip rendering empty assistant messages (placeholder while loading)
          if (msg.role === "assistant" && !msg.content && !msg.notes?.length) {
            return null
          }
          return (
            <Message key={i} role={msg.role}>
              {msg.content}
              {msg.notes && msg.notes.length > 0 && (
                <NotesDisplay notes={msg.notes} />
              )}
            </Message>
          )
        })}
        {/* Show music loading indicator for hybrid agent mode */}
        {isLoading && agentType === "hybrid" && <MusicLoadingIndicator />}
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
        <InputRow>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeThreadId
                ? "Continue the conversation..."
                : "Describe your song..."
            }
            disabled={isLoading || backendStatus === "disconnected"}
            style={{ flex: 1 }}
          />
          <VoiceRecorder
            onNotesDetected={handleNotesDetected}
            onAudioCaptured={handleAudioCaptured}
          />
        </InputRow>
        {voiceProcessing && voiceProgress && (
          <VoiceProcessingIndicator>{voiceProgress}</VoiceProcessingIndicator>
        )}
        {isLoading ? (
          <InterruptButton onClick={handleInterrupt}>
            Stop Generation
          </InterruptButton>
        ) : (
          <Button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || backendStatus === "disconnected"}
          >
            {activeThreadId ? "Send" : "Generate"}
          </Button>
        )}
      </InputContainer>
    </Container>
  )
}
