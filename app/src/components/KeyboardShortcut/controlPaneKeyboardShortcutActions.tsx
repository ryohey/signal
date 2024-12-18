import {
  copyControlSelection,
  deleteControlSelection,
  duplicateControlSelection,
  resetControlSelection,
} from "../../actions/control"
import { useStores } from "../../hooks/useStores"

export const useControlPaneKeyboardShortcutActions = () => {
  const rootStore = useStores()

  return () => [
    { code: "Escape", run: () => resetControlSelection(rootStore)() },
    { code: "Backspace", run: () => deleteControlSelection(rootStore)() },
    { code: "Delete", run: () => deleteControlSelection(rootStore)() },
    {
      code: "KeyC",
      metaKey: true,
      run: () => copyControlSelection(rootStore)(),
    },
    {
      code: "KeyX",
      metaKey: true,
      run: () => {
        copyControlSelection(rootStore)()
        deleteControlSelection(rootStore)()
      },
    },
    {
      code: "KeyD",
      metaKey: true,
      run: () => duplicateControlSelection(rootStore)(),
    },
  ]
}
