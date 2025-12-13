import { atom, useAtomValue, useSetAtom } from "jotai"

export type EditorMode = "basic" | "advanced"

const editorModeAtom = atom<EditorMode>("basic")

export function useEditorMode() {
  const mode = useAtomValue(editorModeAtom)
  const setMode = useSetAtom(editorModeAtom)

  return {
    mode,
    setMode,
    toggle: () => setMode((prev) => (prev === "basic" ? "advanced" : "basic")),
    isAdvanced: mode === "advanced",
    isBasic: mode === "basic",
  }
}

