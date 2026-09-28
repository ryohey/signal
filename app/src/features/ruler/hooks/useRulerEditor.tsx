import type { RulerEditor } from "@signal-app/ruler-editor"
import { createContext, useContext } from "react"

export const RulerEditorContext = createContext<RulerEditor | undefined>(
  undefined,
)

export function useRulerEditor(): RulerEditor {
  const rulerEditor = useContext(RulerEditorContext)
  if (rulerEditor === undefined) {
    throw new Error("useRulerEditor must be used within a RulerEditorProvider")
  }
  return rulerEditor
}
