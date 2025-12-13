import { useMemo } from "react"
import {
  useCopyControlSelection,
  useCutControlSelection,
  useDeleteControlSelection,
  useDuplicateControlSelection,
  usePasteControlSelection,
} from "../actions/control"
import { useControlPane } from "./useControlPane"
import { useKeyboardShortcut } from "./useKeyboardShortcut"

export const useControlPaneKeyboardShortcut = () => {
  const { resetSelection } = useControlPane()
  const deleteControlSelection = useDeleteControlSelection()
  const copyControlSelection = useCopyControlSelection()
  const duplicateControlSelection = useDuplicateControlSelection()
  const pasteControlSelection = usePasteControlSelection()
  const cutControlSelection = useCutControlSelection()

  const actions = useMemo(
    () => [
      { code: "Escape", run: resetSelection },
      { code: "Backspace", run: deleteControlSelection },
      { code: "Delete", run: deleteControlSelection },
      {
        code: "KeyC",
        metaKey: true,
        run: copyControlSelection,
      },
      {
        code: "KeyV",
        metaKey: true,
        run: () => pasteControlSelection(),
      },
      {
        code: "KeyX",
        metaKey: true,
        run: cutControlSelection,
      },
      {
        code: "KeyD",
        metaKey: true,
        run: () => duplicateControlSelection(),
      },
    ],
    [
      resetSelection,
      deleteControlSelection,
      duplicateControlSelection,
      copyControlSelection,
      pasteControlSelection,
      cutControlSelection,
    ]
  )

  return useKeyboardShortcut({
    actions,
    onCopy: copyControlSelection,
    onPaste: pasteControlSelection,
    onCut: cutControlSelection,
  })
}
