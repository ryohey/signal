import { Song } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useAtomCallback } from "jotai/utils"
import { useCallback } from "react"
import {
  HistoryAtomsSnapshot,
  restoreHistoryAtoms,
  snapshotHistoryAtoms,
} from "./historyAtom"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

type HistorySnapshot = {
  song: ReturnType<Song["serialize"]>
  atoms: HistoryAtomsSnapshot
}

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

// Snapshots the song plus every atom registered via `historyAtom`, so a
// feature joins history by wrapping its atoms, not by being listed here.
function useSnapshot() {
  const { songStore } = useStores()

  return useAtomCallback(
    useCallback(
      (get): HistorySnapshot => ({
        song: songStore.serialize(),
        atoms: snapshotHistoryAtoms(get),
      }),
      [songStore],
    ),
  )
}

function useRestore() {
  const { setSong } = useSong()

  return useAtomCallback(
    useCallback(
      (_get, set, snapshot: HistorySnapshot) => {
        setSong(Song.deserialize(snapshot.song))
        restoreHistoryAtoms(set, snapshot.atoms)
      },
      [setSong],
    ),
  )
}

function usePushHistory() {
  const snapshot = useSnapshot()

  return useAtomCallback(
    useCallback(
      (_get, set) => {
        set(pushHistoryAtom, snapshot())
      },
      [snapshot],
    ),
  )
}

function useUndo() {
  const snapshot = useSnapshot()
  const restore = useRestore()

  return useAtomCallback(
    useCallback(
      (_get, set) => {
        const state = set(undoAtom, snapshot())
        if (state) {
          restore(state)
        }
      },
      [restore, snapshot],
    ),
  )
}

function useRedo() {
  const snapshot = useSnapshot()
  const restore = useRestore()

  return useAtomCallback(
    useCallback(
      (_get, set) => {
        const state = set(redoAtom, snapshot())
        if (state) {
          restore(state)
        }
      },
      [snapshot, restore],
    ),
  )
}

// atoms
const undoHistoryAtom = atom<readonly HistorySnapshot[]>([])
const redoHistoryAtom = atom<readonly HistorySnapshot[]>([])

// derived atoms
const hasUndoAtom = atom((get) => get(undoHistoryAtom).length > 0)
const hasRedoAtom = atom((get) => get(redoHistoryAtom).length > 0)

// actions
const pushHistoryAtom = atom(null, (_get, set, state: HistorySnapshot) => {
  set(undoHistoryAtom, (prev) => [...prev, state])
  set(redoHistoryAtom, [])
})
const undoAtom = atom(null, (get, set, currentState: HistorySnapshot) => {
  const undoHistory = [...get(undoHistoryAtom)]
  const state = undoHistory.pop()
  if (state) {
    set(undoHistoryAtom, undoHistory)
    set(redoHistoryAtom, (prev) => [...prev, currentState])
  }
  return state
})
const redoAtom = atom(null, (get, set, currentState: HistorySnapshot) => {
  const redoHistory = [...get(redoHistoryAtom)]
  const state = redoHistory.pop()
  if (state) {
    set(redoHistoryAtom, redoHistory)
    set(undoHistoryAtom, (prev) => [...prev, currentState])
  }
  return state
})
const clearHistoryAtom = atom(null, (_get, set) => {
  set(undoHistoryAtom, [])
  set(redoHistoryAtom, [])
})
