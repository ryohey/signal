import type { ArrangeEditor } from "@signal-app/arrange-editor"
import { createContext, useContext } from "react"

export const ArrangeEditorContext = createContext<ArrangeEditor | undefined>(
  undefined,
)

export function useArrangeEditor(): ArrangeEditor {
  const arrangeEditor = useContext(ArrangeEditorContext)
  if (arrangeEditor === undefined) {
    throw new Error(
      "useArrangeEditor must be used within an ArrangeEditorProvider",
    )
  }
  return arrangeEditor
}
