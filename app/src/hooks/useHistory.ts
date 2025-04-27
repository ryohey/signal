import { useCallback } from "react"
import { useStores } from "./useStores"

export function useHistory() {
  const { historyStore } = useStores()

  return {
    pushHistory: useCallback(() => historyStore.push(), [historyStore]),
    undo: useCallback(() => historyStore.undo(), [historyStore]),
    redo: useCallback(() => historyStore.redo(), [historyStore]),
  }
}
