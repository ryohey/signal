import { VelocityEditor } from "@signal-app/velocity-editor"
import { createContext, useContext } from "react"

export const VelocityEditorContext = createContext<VelocityEditor | undefined>(
  undefined,
)

export function useVelocityEditor(): VelocityEditor {
  const velocityEditor = useContext(VelocityEditorContext)
  if (velocityEditor === undefined) {
    throw new Error(
      "useVelocityEditor must be used within a VelocityEditorProvider",
    )
  }
  return velocityEditor
}
