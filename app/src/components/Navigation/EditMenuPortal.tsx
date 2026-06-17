import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react"

type EditMenuEntry = {
  id: string
  children: ReactNode
}

type EditMenuChildrenContextValue = {
  entries: EditMenuEntry[]
  register: (id: string, children: ReactNode) => void
  unregister: (id: string) => void
}

const EditMenuChildrenContext =
  createContext<EditMenuChildrenContextValue | null>(null)

const useEditMenuChildrenContext = () => {
  const context = useContext(EditMenuChildrenContext)

  if (context === null) {
    throw new Error(
      "EditMenuChildren must be used within EditMenuChildrenProvider",
    )
  }

  return context
}

export const EditMenuChildrenProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [entries, setEntries] = useState<EditMenuEntry[]>([])

  const register = useCallback((id: string, children: ReactNode) => {
    setEntries((prev) => {
      const index = prev.findIndex((entry) => entry.id === id)

      if (index === -1) {
        return [...prev, { id, children }]
      }

      if (prev[index].children === children) {
        return prev
      }

      const next = [...prev]
      next[index] = { id, children }
      return next
    })
  }, [])

  const unregister = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  const value = useMemo(
    () => ({ entries, register, unregister }),
    [entries, register, unregister],
  )

  return (
    <EditMenuChildrenContext.Provider value={value}>
      {children}
    </EditMenuChildrenContext.Provider>
  )
}

export const useEditMenuChildren = () => {
  const { entries } = useEditMenuChildrenContext()
  return entries
}

export const EditMenuPortal: FC<{ children: ReactNode }> = ({ children }) => {
  const { register, unregister } = useEditMenuChildrenContext()
  const id = useId()

  useEffect(() => {
    register(id, children)
    return () => unregister(id)
  }, [children, id, register, unregister])

  return null
}
