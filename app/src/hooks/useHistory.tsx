import { Song } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useAtomCallback } from "jotai/utils"
import { useCallback } from "react"
import { useArrangeView } from "./useArrangeView"
import { useControlPane } from "./useControlPane"
import { usePianoRoll } from "./usePianoRoll"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

type SerializedRootStore = ReturnType<ReturnType<typeof useSerializeState>>

export function useHistory() {
  return {
    get hasUndo() {
      return useAtomValue(hasUndoAtom)
    },
    get hasRedo() {
      return useAtomValue(hasRedoAtom)
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
    clear: useSetAtom(clearHistoryAtom),
  }
}

function useSerializeState() {
  const { songStore } = useStores()
  const { serializeState: serializePianoRoll } = usePianoRoll()
  const { serializeState: serializeControlPane } = useControlPane()
  const { serializeState: serializeArrangeView } = useArrangeView()

  return useCallback(
    () => ({
      song: songStore.serialize(),
      pianoRollStore: serializePianoRoll(),
      controlStore: serializeControlPane(),
      arrangeViewStore: serializeArrangeView(),
    }),
    [songStore, serializePianoRoll, serializeControlPane, serializeArrangeView],
  )
}

function useRestoreState() {
  const { setSong } = useSong()
  const { restoreState: restorePianoRoll } = usePianoRoll()
  const { restoreState: restoreControlPane } = useControlPane()
  const { restoreState: restoreArrangeView } = useArrangeView()

  return useCallback(
    (serializedState: SerializedRootStore) => {
      const song = Song.deserialize(serializedState.song)
      setSong(song)
      restorePianoRoll(serializedState.pianoRollStore)
      restoreControlPane(serializedState.controlStore)
      restoreArrangeView(serializedState.arrangeViewStore)
    },
    [setSong, restorePianoRoll, restoreControlPane, restoreArrangeView],
  )
}

function usePushHistory() {
  const serializeState = useSerializeState()

  return useAtomCallback(
    useCallback(
      (_get, set) => {
        const state = serializeState()
        set(pushHistoryAtom, state)
      },
      [serializeState],
    ),
  )
}

function useUndo() {
  const serializeState = useSerializeState()
  const restoreState = useRestoreState()

  return useAtomCallback(
    useCallback(
      (_get, set) => {
        const state = set(undoAtom, serializeState())
        if (state) {
          restoreState(state)
        }
      },
      [restoreState, serializeState],
    ),
  )
}

function useRedo() {
  const serializeState = useSerializeState()
  const restoreState = useRestoreState()

  return useAtomCallback(
    useCallback(
      (_get, set) => {
        const state = set(redoAtom, serializeState())
        if (state) {
          restoreState(state)
        }
      },
      [serializeState, restoreState],
    ),
  )
}

// atoms
const undoHistoryAtom = atom<readonly SerializedRootStore[]>([])
const redoHistoryAtom = atom<readonly SerializedRootStore[]>([])

// derived atoms
const hasUndoAtom = atom((get) => get(undoHistoryAtom).length > 0)
const hasRedoAtom = atom((get) => get(redoHistoryAtom).length > 0)

// actions
const pushHistoryAtom = atom(null, (_get, set, state: SerializedRootStore) => {
  set(undoHistoryAtom, (prev) => [...prev, state])
  set(redoHistoryAtom, [])
})
const undoAtom = atom(null, (get, set, currentState: SerializedRootStore) => {
  const undoHistory = [...get(undoHistoryAtom)]
  const state = undoHistory.pop()
  if (state) {
    set(undoHistoryAtom, undoHistory)
    set(redoHistoryAtom, (prev) => [...prev, currentState])
  }
  return state
})
const redoAtom = atom(null, (get, set, currentState: SerializedRootStore) => {
  const redoHistory = [...get(redoHistoryAtom)]
  const state = redoHistory.pop()
  if (state) {
    set(redoHistoryAtom, redoHistory)
    set(undoHistoryAtom, (prev) => [...prev, currentState])
  }
  return state
})
const clearHistoryAtom = atom(null, (get, set) => {
  set(undoHistoryAtom, [])
  set(redoHistoryAtom, [])
})
