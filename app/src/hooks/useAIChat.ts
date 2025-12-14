import { atom, useAtomValue, useSetAtom } from "jotai"
import { GenerationStage } from "../services/aiBackend"
import type { ToolCall } from "../services/hybridAgent"

const aiChatOpenAtom = atom(true) // Default open for MVP

export interface ChatMessage {
  role: "user" | "assistant" | "error"
  content: string
  notes?: Array<{
    pitch: number
    start: number
    duration: number
    velocity: number
  }>
}

const aiChatMessagesAtom = atom<ChatMessage[]>([])
const aiChatIsLoadingAtom = atom<boolean>(false)
const aiChatStreamingThinkingAtom = atom<string>("")
const aiChatStreamingToolCallsAtom = atom<ToolCall[]>([])
const aiChatExecutedToolIdsAtom = atom<Set<string>>(new Set<string>())
const aiChatGenerationStageAtom = atom<GenerationStage | null>(null)
const aiChatGenerationProgressAtom = atom<string>("")
const aiChatCurrentAttemptAtom = atom<number>(0)
const aiChatStreamingMessageIndexAtom = atom<number>(-1)
const aiChatActiveThreadIdAtom = atom<string | null>(null)

export function useAIChat() {
  const isOpen = useAtomValue(aiChatOpenAtom)
  const setIsOpen = useSetAtom(aiChatOpenAtom)
  const messages = useAtomValue(aiChatMessagesAtom)
  const setMessages = useSetAtom(aiChatMessagesAtom)
  const isLoading = useAtomValue(aiChatIsLoadingAtom)
  const setIsLoading = useSetAtom(aiChatIsLoadingAtom)
  const streamingThinking = useAtomValue(aiChatStreamingThinkingAtom)
  const setStreamingThinking = useSetAtom(aiChatStreamingThinkingAtom)
  const streamingToolCalls = useAtomValue(aiChatStreamingToolCallsAtom)
  const setStreamingToolCalls = useSetAtom(aiChatStreamingToolCallsAtom)
  const executedToolIds = useAtomValue(aiChatExecutedToolIdsAtom)
  const setExecutedToolIds = useSetAtom(aiChatExecutedToolIdsAtom)
  const generationStage = useAtomValue(aiChatGenerationStageAtom)
  const setGenerationStage = useSetAtom(aiChatGenerationStageAtom)
  const generationProgress = useAtomValue(aiChatGenerationProgressAtom)
  const setGenerationProgress = useSetAtom(aiChatGenerationProgressAtom)
  const currentAttempt = useAtomValue(aiChatCurrentAttemptAtom)
  const setCurrentAttempt = useSetAtom(aiChatCurrentAttemptAtom)
  const streamingMessageIndex = useAtomValue(aiChatStreamingMessageIndexAtom)
  const setStreamingMessageIndex = useSetAtom(aiChatStreamingMessageIndexAtom)
  const activeThreadId = useAtomValue(aiChatActiveThreadIdAtom)
  const setActiveThreadId = useSetAtom(aiChatActiveThreadIdAtom)

  return {
    isOpen,
    setOpen: setIsOpen,
    toggle: () => setIsOpen((prev) => !prev),
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    streamingThinking,
    setStreamingThinking,
    streamingToolCalls,
    setStreamingToolCalls,
    executedToolIds,
    setExecutedToolIds,
    generationStage,
    setGenerationStage,
    generationProgress,
    setGenerationProgress,
    currentAttempt,
    setCurrentAttempt,
    streamingMessageIndex,
    setStreamingMessageIndex,
    activeThreadId,
    setActiveThreadId,
  }
}
