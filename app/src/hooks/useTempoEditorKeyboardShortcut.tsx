import { useCallback, useMemo } from "react"
import {
  useCopyTempoSelection,
  useDeleteTempoSelection,
  useDuplicateTempoSelection,
  usePasteTempoSelection,
  useResetTempoSelection,
} from "../actions/tempo"
import { readJSONFromClipboard } from "../services/Clipboard"
import { useKeyboardShortcut } from "./useKeyboardShortcut"
import { useTempoEditor } from "./useTempoEditor"

export const useTempoEditorKeyboardShortcut = () => {
  const { setMouseMode } = useTempoEditor()
  const resetTempoSelection = useResetTempoSelection()
  const deleteTempoSelection = useDeleteTempoSelection()
  const copyTempoSelection = useCopyTempoSelection()
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
      { code: "Escape", run: resetTempoSelection },
      { code: "Backspace", run: deleteTempoSelection },
      { code: "Delete", run: deleteTempoSelection },
      {
        code: "KeyC",
        metaKey: true,
        run: () => copyTempoSelection(),
      },
      {
        code: "KeyX",
        metaKey: true,
        run: () => {
          {
            copyTempoSelection()
            deleteTempoSelection()
          }
        },
      },
      {
        code: "KeyD",
        metaKey: true,
        run: duplicateTempoSelection,
      },
    ],
    [
      setMouseMode,
      resetTempoSelection,
      deleteTempoSelection,
      copyTempoSelection,
      duplicateTempoSelection,
    ],
  )

  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      pasteTempoSelection(readJSONFromClipboard(e))
    },
    [pasteTempoSelection],
  )

  const onCut = useCallback(() => {
    copyTempoSelection()
    deleteTempoSelection()
  }, [copyTempoSelection, deleteTempoSelection])

  return useKeyboardShortcut({
    actions,
    onCopy: copyTempoSelection,
    onPaste,
    onCut,
  })
}
