import { useCallback, useMemo } from "react"
import {
  useCopyTempoSelection,
  useDeleteTempoSelection,
  useDuplicateTempoSelection,
  usePasteTempoSelection,
  useResetTempoSelection,
} from "../actions/tempo"
import { TempoEventsClipboardDataSchema } from "../clipboard/clipboardTypes"
import { isFocusable } from "../components/KeyboardShortcut/isFocusable"
import { readClipboardData } from "../services/Clipboard"
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
    async (e: ClipboardEvent) => {
      if (e.target !== null && isFocusable(e.target)) {
        return
      }

      const obj = await readClipboardData()
      const { data } = TempoEventsClipboardDataSchema.safeParse(obj)

      if (!data) {
        return
      }

      pasteTempoSelection()
    },
    [pasteTempoSelection],
  )

  return useKeyboardShortcut({
    actions,
    onPaste,
  })
}
