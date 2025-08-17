import { useCallback, useMemo } from "react"
import {
  useCopyControlSelection,
  useDeleteControlSelection,
  useDuplicateControlSelection,
  usePasteControlSelection,
} from "../actions/control"
import { readJSONFromClipboard } from "../services/Clipboard"
import { useControlPane } from "./useControlPane"
import { useKeyboardShortcut } from "./useKeyboardShortcut"

export const useControlPaneKeyboardShortcut = () => {
  const { resetSelection } = useControlPane()
  const deleteControlSelection = useDeleteControlSelection()
  const copyControlSelection = useCopyControlSelection()
  const duplicateControlSelection = useDuplicateControlSelection()
  const pasteControlSelection = usePasteControlSelection()

  const actions = useMemo(
    () => [
      { code: "Escape", run: resetSelection },
      { code: "Backspace", run: deleteControlSelection },
      { code: "Delete", run: deleteControlSelection },
      {
        code: "KeyD",
        metaKey: true,
        run: () => duplicateControlSelection(),
      },
    ],
    [resetSelection, deleteControlSelection, duplicateControlSelection],
  )

  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      pasteControlSelection(readJSONFromClipboard(e))
    },
    [pasteControlSelection],
  )

  const onCut = useCallback(() => {
    copyControlSelection()
    deleteControlSelection()
  }, [copyControlSelection, deleteControlSelection])

  return useKeyboardShortcut({
    actions,
    onCopy: copyControlSelection,
    onPaste,
    onCut,
  })
}
