import { makeObservable, observable } from "mobx"
import { createContext, useContext } from "react"
import { deserialize } from "serializr"
import Song from "../song"
import { SerializedRootStore } from "../stores/RootStore"
import { useArrangeView } from "./useArrangeView"
import { useControlPane } from "./useControlPane"
import { useMobxSelector } from "./useMobxSelector"
import { usePianoRoll } from "./usePianoRoll"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

class HistoryStore {
  undoHistory: readonly SerializedRootStore[] = []
  redoHistory: readonly SerializedRootStore[] = []

  constructor() {
    makeObservable(this, {
      undoHistory: observable.ref,
      redoHistory: observable.ref,
    })
  }
}

const HistoryStoreContext = createContext(new HistoryStore())

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  return (
    <HistoryStoreContext.Provider value={new HistoryStore()}>
      {children}
    </HistoryStoreContext.Provider>
  )
}

export function useHistory() {
  const historyStore = useContext(HistoryStoreContext)

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
    get pushHistory() {
      return usePushHistory()
    },
    get undo() {
      return useUndo()
    },
    get redo() {
      return useRedo()
    },
    get clear() {
      return useClearHistory()
    },
  }
}

function useSerializeState() {
  const { songStore } = useStores()
  const { serializeState: serializePianoRoll } = usePianoRoll()
  const { serializeState: serializeControlPane } = useControlPane()
  const { serializeState: serializeArrangeView } = useArrangeView()

  return () =>
    ({
      song: songStore.serialize(),
      pianoRollStore: serializePianoRoll(),
      controlStore: serializeControlPane(),
      arrangeViewStore: serializeArrangeView(),
    }) as SerializedRootStore
}

function useRestoreState() {
  const { setSong } = useSong()
  const { restoreState: restorePianoRoll } = usePianoRoll()
  const { restoreState: restoreControlPane } = useControlPane()
  const { restoreState: restoreArrangeView } = useArrangeView()

  return (serializedState: SerializedRootStore) => {
    const song = deserialize(Song, serializedState.song)
    setSong(song)
    restorePianoRoll(serializedState.pianoRollStore)
    restoreControlPane(serializedState.controlStore)
    restoreArrangeView(serializedState.arrangeViewStore)
  }
}

function usePushHistory() {
  const historyStore = useContext(HistoryStoreContext)
  const serializeState = useSerializeState()

  return () => {
    historyStore.undoHistory = [...historyStore.undoHistory, serializeState()]
  }
}

function useUndo() {
  const historyStore = useContext(HistoryStoreContext)
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
  const historyStore = useContext(HistoryStoreContext)
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
  const historyStore = useContext(HistoryStoreContext)

  return () => {
    historyStore.undoHistory = []
    historyStore.redoHistory = []
  }
}
