import {
  createContext,
  type FC,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

export interface ProgressMessage {
  message: string
  key: number
}

type CloseHandler = () => void

export const ProgressContext = createContext<{
  addMessage: (message: ProgressMessage) => CloseHandler
}>(null as never)

interface ProgressProps {
  open: boolean
  message: string
}

export const ProgressProvider: FC<{
  children: ReactNode
  component: FC<ProgressProps>
}> = ({ children, component: Progress }) => {
  const [messages, setMessages] = useState<ProgressMessage[]>([])

  const removeMessage = useCallback(
    (key: number) => setMessages((arr) => arr.filter((m) => m.key !== key)),
    []
  )

  const addMessage = useCallback(
    (message: ProgressMessage) => {
      setMessages((arr) => [...arr, message])
      return () => removeMessage(message.key)
    },
    [removeMessage]
  )

  return (
    <ProgressContext.Provider
      value={{
        addMessage,
      }}
    >
      {children}
      {messages.map((m) => (
        <Progress key={m.key} open={true} message={m.message} />
      ))}
    </ProgressContext.Provider>
  )
}

export const useProgress = () => {
  const { addMessage } = useContext(ProgressContext)

  const show = useCallback(
    (message: string) => {
      return addMessage({ message, key: Date.now() })
    },
    [addMessage]
  )

  const progress = useMemo(
    () => ({
      show,
    }),
    [show]
  )

  return progress
}
