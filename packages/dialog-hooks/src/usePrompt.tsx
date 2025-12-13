import {
  createContext,
  type FC,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

export const PromptProvider: FC<{
  children: ReactNode
  component: FC<PromptProps>
}> = ({ children, component: PromptDialog }) => {
  const [prompt, setPrompt] = useState<PromptProps | null>(null)

  const setPromptCallback = useCallback(
    (props: PromptProps | null) => setPrompt(props),
    []
  )

  return (
    <PromptContext.Provider
      value={{
        setPrompt: setPromptCallback,
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

  const show = useCallback(
    async (options: PromptOptions): Promise<string | null> => {
      return new Promise((resolve, _reject) => {
        setPrompt({
          ...options,
          callback: (text) => resolve(text),
        })
      })
    },
    [setPrompt]
  )

  const prompt = useMemo(
    () => ({
      show,
    }),
    [show]
  )

  return prompt
}
