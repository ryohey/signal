import { useCallback, useMemo } from "react"
import {
  useCopyTempoSelection,
  useCutTempoSelection,
  useDeleteTempoSelection,
  useDuplicateTempoSelection,
  usePasteTempoSelection,
} from "../actions/tempo"
import { useKeyboardShortcut } from "./useKeyboardShortcut"
import { useTempoEditor } from "./useTempoEditor"

export const useTempoEditorKeyboardShortcut = () => {
  const { setMouseMode } = useTempoEditor()
  const { resetSelection } = useTempoEditor()
  const deleteTempoSelection = useDeleteTempoSelection()
  const copyTempoSelection = useCopyTempoSelection()
  const cutTempoSelection = useCutTempoSelection()
  const duplicateTempoSelection = useDuplicateTempoSelection()
  const pasteTempoSelection = usePasteTempoSelection()

  const actions = useMemo(
    () => [
      {
        code: "Digit1",
        run: () => setMouseMode("pencil"),
      },
      {
        code: "Digit2",
        run: () => setMouseMode("selection"),
      },
      { code: "Escape", run: resetSelection },
      { code: "Backspace", run: deleteTempoSelection },
      { code: "Delete", run: deleteTempoSelection },
      {
        code: "KeyC",
        metaKey: true,
        run: copyTempoSelection,
      },
      {
        code: "KeyV",
        metaKey: true,
        run: () => pasteTempoSelection(),
      },
      {
        code: "KeyX",
        metaKey: true,
        run: cutTempoSelection,
      },
      {
        code: "KeyD",
        metaKey: true,
        run: duplicateTempoSelection,
      },
    ],
    [
      setMouseMode,
      resetSelection,
      deleteTempoSelection,
      copyTempoSelection,
      duplicateTempoSelection,
      pasteTempoSelection,
      cutTempoSelection,
    ],
  )

  const onCut = useCallback(() => {
    copyTempoSelection()
    deleteTempoSelection()
  }, [copyTempoSelection, deleteTempoSelection])

  return useKeyboardShortcut({
    actions,
    onCopy: copyTempoSelection,
    onPaste: pasteTempoSelection,
    onCut,
  })
}
