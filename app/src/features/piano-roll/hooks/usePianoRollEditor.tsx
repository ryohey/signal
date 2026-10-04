import type { PianoRollEditor } from "@signal-app/pianoroll-editor"
import { createContext, useContext } from "react"

// biome-ignore lint/style/noNonNullAssertion: we assume the provider is always used
const PianoRollEditorContext = createContext<PianoRollEditor>(null!)

export const PianoRollEditorProvider = PianoRollEditorContext.Provider

export function usePianoRollEditor() {
  return useContext(PianoRollEditorContext)
}
