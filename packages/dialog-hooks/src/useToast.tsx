import { createContext, FC, ReactNode, useContext, useState } from "react"

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

  const removeMessage = (key: number) =>
    setMessages((arr) => arr.filter((m) => m.key !== key))

  return (
    <ToastContext.Provider
      value={{
        addMessage(message) {
          setMessages((arr) => [...arr, message])
        },
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

  const show = (message: string, options: { severity: ToastSeverity }) => {
    addMessage({ message, ...options, key: new Date().getTime() })
  }

  return {
    show,
    info(message: string) {
      show(message, { severity: "info" })
    },
    success(message: string) {
      show(message, { severity: "success" })
    },
    warning(message: string) {
      show(message, { severity: "warning" })
    },
    error(message: string) {
      show(message, { severity: "error" })
    },
  }
}
