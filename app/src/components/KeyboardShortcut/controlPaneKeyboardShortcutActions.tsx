import {
  useCopyControlSelection,
  useDeleteControlSelection,
  useDuplicateControlSelection,
} from "../../actions/control"
import { useControlPane } from "../../hooks/useControlPane"

export const useControlPaneKeyboardShortcutActions = () => {
  const { resetSelection } = useControlPane()
  const deleteControlSelection = useDeleteControlSelection()
  const copyControlSelection = useCopyControlSelection()
  const duplicateControlSelection = useDuplicateControlSelection()

  return () => [
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
  ]
}
