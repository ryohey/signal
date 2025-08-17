import { useMemo } from "react"
import {
  useCopyControlSelection,
  useDeleteControlSelection,
  useDuplicateControlSelection,
} from "../actions/control"
import { useControlPane } from "./useControlPane"
import { useKeyboardShortcut } from "./useKeyboardShortcut"

export const useControlPaneKeyboardShortcut = () => {
  const { resetSelection } = useControlPane()
  const deleteControlSelection = useDeleteControlSelection()
  const copyControlSelection = useCopyControlSelection()
  const duplicateControlSelection = useDuplicateControlSelection()

  const actions = useMemo(
    () => [
      { code: "Escape", run: resetSelection },
      { code: "Backspace", run: deleteControlSelection },
      { code: "Delete", run: deleteControlSelection },
      {
        code: "KeyC",
        metaKey: true,
        run: () => copyControlSelection(),
      },
      {
        code: "KeyX",
        metaKey: true,
        run: () => {
          copyControlSelection()
          deleteControlSelection()
        },
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
      copyControlSelection,
      duplicateControlSelection,
    ],
  )

  return useKeyboardShortcut({
    actions,
  })
}
