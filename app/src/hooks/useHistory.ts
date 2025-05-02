import { useCallback } from "react"
import { useStores } from "./useStores"

export function useHistory() {
  const { historyStore } = useStores()

  return {
    get hasUndo() {
      return historyStore.hasUndo
    },
    get hasRedo() {
      return historyStore.hasRedo
    },
    pushHistory: useCallback(() => historyStore.push(), [historyStore]),
    undo: useCallback(() => historyStore.undo(), [historyStore]),
    redo: useCallback(() => historyStore.redo(), [historyStore]),
    clear: useCallback(() => historyStore.clear(), [historyStore]),
  }
}
