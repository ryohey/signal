import { deserialize } from "serializr"
import Song from "../song"
import { SerializedRootStore } from "../stores/RootStore"
import { useMobxSelector } from "./useMobxSelector"
import { useStores } from "./useStores"

export function useHistory() {
  const { historyStore } = useStores()

  return {
    get hasUndo() {
      return useMobxSelector(
        () => historyStore.undoHistory.length > 0,
        [historyStore],
      )
    },
    get hasRedo() {
      return useMobxSelector(
        () => historyStore.redoHistory.length > 0,
        [historyStore],
      )
    },
    pushHistory: usePushHistory(),
    undo: useUndo(),
    redo: useRedo(),
    clear: useClearHistory(),
  }
}

function useSerializeState() {
  const { songStore, pianoRollStore, controlStore, arrangeViewStore } =
    useStores()

  return () =>
    ({
      song: songStore.serialize(),
      pianoRollStore: pianoRollStore.serialize(),
      controlStore: controlStore.serialize(),
      arrangeViewStore: arrangeViewStore.serialize(),
    }) as SerializedRootStore
}

function useRestoreState() {
  const { songStore, pianoRollStore, controlStore, arrangeViewStore } =
    useStores()

  return (serializedState: SerializedRootStore) => {
    const song = deserialize(Song, serializedState.song)
    songStore.song = song
    pianoRollStore.restore(serializedState.pianoRollStore)
    controlStore.restore(serializedState.controlStore)
    arrangeViewStore.restore(serializedState.arrangeViewStore)
  }
}

function usePushHistory() {
  const { historyStore } = useStores()
  const serializeState = useSerializeState()

  return () => {
    historyStore.undoHistory = [...historyStore.undoHistory, serializeState()]
  }
}

function useUndo() {
  const { historyStore } = useStores()
  const serializeState = useSerializeState()
  const restoreState = useRestoreState()

  return () => {
    const undoHistory = [...historyStore.undoHistory]
    const state = undoHistory.pop()
    if (state) {
      historyStore.undoHistory = undoHistory
      historyStore.redoHistory = [...historyStore.redoHistory, serializeState()]
      restoreState(state)
    }
  }
}

function useRedo() {
  const { historyStore } = useStores()
  const serializeState = useSerializeState()
  const restoreState = useRestoreState()

  return () => {
    const redoHistory = [...historyStore.redoHistory]
    const state = redoHistory.pop()
    if (state) {
      historyStore.redoHistory = redoHistory
      historyStore.undoHistory = [...historyStore.undoHistory, serializeState()]
      restoreState(state)
    }
  }
}

function useClearHistory() {
  const { historyStore } = useStores()

  return () => {
    historyStore.undoHistory = []
    historyStore.redoHistory = []
  }
}
