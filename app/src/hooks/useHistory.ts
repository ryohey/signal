import { useStores } from "./useStores"

export function useHistory() {
  const { historyStore } = useStores()

  return {
    pushHistory: () => historyStore.push(),
    undo: () => historyStore.undo(),
    redo: () => historyStore.redo(),
  }
}
