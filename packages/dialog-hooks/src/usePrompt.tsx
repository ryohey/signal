import { createContext, FC, ReactNode, useContext, useState } from "react"

export const PromptProvider: FC<{
  children: ReactNode
  component: FC<PromptProps>
}> = ({ children, component: PromptDialog }) => {
  const [prompt, setPrompt] = useState<PromptProps | null>(null)

  return (
    <PromptContext.Provider
      value={{
        setPrompt,
      }}
    >
      {children}
      {prompt !== null && <PromptDialog {...prompt} />}
    </PromptContext.Provider>
  )
}

export interface PromptOptions {
  title: string
  message?: string
  initialText?: string
  okText?: string
  cancelText?: string
}

export type PromptProps = PromptOptions & {
  callback: (text: string | null) => void
}

export const PromptContext = createContext<{
  setPrompt: (props: PromptProps | null) => void
}>(null as never)

export const usePrompt = () => {
  const { setPrompt } = useContext(PromptContext)

  return {
    async show(options: PromptOptions): Promise<string | null> {
      return new Promise((resolve, _reject) => {
        setPrompt({
          ...options,
          callback: (text) => resolve(text),
        })
      })
    },
  }
}
