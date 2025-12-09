import {
  createContext,
  type FC,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

export type ToastSeverity = "warning" | "error" | "info" | "success"

export interface ToastMessage {
  message: string
  severity: ToastSeverity
  key: number
}

export const ToastContext = createContext<{
  addMessage: (message: ToastMessage) => void
}>(null as never)

interface ToastProps {
  message: string
  severity: ToastSeverity
  onExited: () => void
}

export const ToastProvider: FC<{
  children: ReactNode
  component: FC<ToastProps>
}> = ({ children, component: Toast }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const removeMessage = useCallback(
    (key: number) => setMessages((arr) => arr.filter((m) => m.key !== key)),
    []
  )

  const addMessage = useCallback((message: ToastMessage) => {
    setMessages((arr) => [...arr, message])
  }, [])

  return (
    <ToastContext.Provider
      value={{
        addMessage,
      }}
    >
      {children}
      {messages.map((m) => (
        <Toast
          key={m.key}
          message={m.message}
          severity={m.severity}
          onExited={() => removeMessage(m.key)}
        />
      ))}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const { addMessage } = useContext(ToastContext)

  const show = useCallback(
    (message: string, options: { severity: ToastSeverity }) => {
      addMessage({ message, ...options, key: Date.now() })
    },
    [addMessage]
  )

  const info = useCallback(
    (message: string) => {
      show(message, { severity: "info" })
    },
    [show]
  )

  const success = useCallback(
    (message: string) => {
      show(message, { severity: "success" })
    },
    [show]
  )

  const warning = useCallback(
    (message: string) => {
      show(message, { severity: "warning" })
    },
    [show]
  )

  const error = useCallback(
    (message: string) => {
      show(message, { severity: "error" })
    },
    [show]
  )

  const toast = useMemo(
    () => ({
      show,
      info,
      success,
      warning,
      error,
    }),
    [show, info, success, warning, error]
  )

  return toast
}
