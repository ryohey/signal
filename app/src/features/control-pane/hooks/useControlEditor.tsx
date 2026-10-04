import type { ControlEditor } from "@signal-app/control-editor"
import { createContext, useContext } from "react"

export const ControlEditorContext = createContext<ControlEditor | undefined>(
  undefined,
)

export function useControlEditor(): ControlEditor {
  const controlEditor = useContext(ControlEditorContext)
  if (controlEditor === undefined) {
    throw new Error(
      "useControlEditor must be used within a ControlEditorProvider",
    )
  }
  return controlEditor
}
