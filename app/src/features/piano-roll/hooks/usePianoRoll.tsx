import { TrackId, UNASSIGNED_TRACK_ID } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom, useStore } from "jotai"
import { useAtomCallback } from "jotai/utils"
import { Store } from "jotai/vanilla/store"
import { atomEffect } from "jotai-effect"
import { createContext, useCallback, useContext, useMemo } from "react"
import { KeySignature } from "../../../entities/scale/KeySignature"
import { addedSet, deletedSet } from "../../../helpers/set"
import { historyAtom } from "../../../hooks/historyAtom"
import { BeatsProvider } from "../../../hooks/useBeats"
import { QuantizerProvider, useQuantizer } from "../../../hooks/useQuantizer"
import { useSong } from "../../../hooks/useSong"
import { useStores } from "../../../hooks/useStores"
import { TickScrollProvider, useTickScroll } from "../../../hooks/useTickScroll"
import { Selection } from "../entities/Selection"
import { EventViewProvider } from "./useEventView"

type PianoRollStore = {
  quantizerScope: Store
  tickScrollScope: Store
  beatsScope: Store
}

// biome-ignore lint/style/noNonNullAssertion: we ensure the context is provided in PianoRollProvider
export const PianoRollStoreContext = createContext<PianoRollStore>(null!)

export function PianoRollScope({ children }: { children: React.ReactNode }) {
  const { quantizerScope, tickScrollScope, beatsScope } = useContext(
    PianoRollStoreContext,
  )
  return (
    <TickScrollProvider scope={tickScrollScope} minScaleX={0.15} maxScaleX={15}>
      <EventViewProvider>
        <QuantizerProvider scope={quantizerScope} quantize={8}>
          <BeatsProvider scope={beatsScope}>{children}</BeatsProvider>
        </QuantizerProvider>
      </EventViewProvider>
    </TickScrollProvider>
  )
}

export function usePianoRoll() {
  const { songStore } = useStores()
  const store = useStore()

  return {
    get notGhostTrackIds() {
      return useAtomValue(notGhostTrackIdsAtom, { store })
    },
    get mouseMode() {
      return useAtomValue(mouseModeAtom, { store })
    },
    get keySignature() {
      return useAtomValue(keySignatureAtom, { store })
    },
    get selection() {
      return useAtomValue(selectionAtom, { store })
    },
    get selectedTrackId() {
      return useAtomValue(selectedTrackIdAtom, { store })
    },
    get selectedTrackIndex() {
      const { tracks } = useSong()
      const selectedTrackId = useAtomValue(selectedTrackIdAtom, { store })
      return useMemo(
        () => tracks.findIndex((t) => t.id === selectedTrackId),
        [tracks, selectedTrackId],
      )
    },
    get selectedNoteIds() {
      return useAtomValue(selectedNoteIdsAtom, { store })
    },
    get ghostTrackIds() {
      const { tracks } = useSong()
      const notGhostTrackIds = useAtomValue(notGhostTrackIdsAtom, { store })
      const selectedTrackId = useAtomValue(selectedTrackIdAtom, { store })
      const allTrackIds = useMemo(
        () => tracks.map((track) => track.id),
        [tracks],
      )
      return useMemo(
        () =>
          allTrackIds.filter(
            (id) => !notGhostTrackIds.has(id) && id !== selectedTrackId,
          ),
        [allTrackIds, notGhostTrackIds, selectedTrackId],
      )
    },
    get previewingNoteNumbers() {
      return useAtomValue(previewingNoteNumbersAtom, { store })
    },
    get openTransposeDialog() {
      return useAtomValue(openTransposeDialogAtom, { store })
    },
    get newNoteVelocity() {
      return useAtomValue(newNoteVelocityAtom, { store })
    },
    get lastNoteDuration() {
      return useAtomValue(lastNoteDurationAtom, { store })
    },
    get activePane() {
      return useAtomValue(activePaneAtom, { store })
    },
    resetSelection: useSetAtom(resetSelectionAtom, { store }),
    setNotGhostTrackIds: useSetAtom(notGhostTrackIdsAtom, { store }),
    setOpenTransposeDialog: useSetAtom(openTransposeDialogAtom, { store }),
    setKeySignature: useSetAtom(keySignatureAtom, { store }),
    setMouseMode: useSetAtom(mouseModeAtom, { store }),
    addPreviewingNoteNumbers: useSetAtom(addPreviewingNoteNumbersAtom, {
      store,
    }),
    removePreviewingNoteNumbers: useSetAtom(removePreviewingNoteNumbersAtom, {
      store,
    }),
    setSelection: useSetAtom(selectionAtom, { store }),
    setSelectedTrackId: useSetAtom(selectedTrackIdAtom, { store }),
    setSelectedTrackIndex: useAtomCallback(
      useCallback(
        (_get, set, index: number) =>
          set(selectedTrackIdAtom, songStore.song.tracks[index]?.id),
        [songStore.song.tracks],
      ),
      { store },
    ),
    setSelectedNoteIds: useSetAtom(selectedNoteIdsAtom, { store }),
    getSelection: useSetAtom(getSelectionAtom, { store }),
    getSelectedTrack: useAtomCallback(
      useCallback(
        (get) => {
          const selectedTrackId = get(selectedTrackIdAtom)
          return songStore.song.getTrack(selectedTrackId)
        },
        [songStore],
      ),
      { store },
    ),
    getSelectedNoteIds: useSetAtom(getSelectedNoteIdsAtom, { store }),
    setLastNoteDuration: useSetAtom(lastNoteDurationAtom, { store }),
    toggleTool: useSetAtom(toggleToolAtom, { store }),
    setNewNoteVelocity: useSetAtom(newNoteVelocityAtom, { store }),
    setActivePane: useSetAtom(activePaneAtom, { store }),
  }
}

export function usePianoRollTickScroll() {
  const { tickScrollScope } = useContext(PianoRollStoreContext)
  return useTickScroll(tickScrollScope)
}

export function usePianoRollQuantizer() {
  const { quantizerScope } = useContext(PianoRollStoreContext)
  return useQuantizer(quantizerScope)
}

// atoms
const mouseModeAtom = atom<"pencil" | "selection">("pencil")
const selectedTrackIdAtom = historyAtom(atom<TrackId>(UNASSIGNED_TRACK_ID))
const selectionAtom = historyAtom(atom<Selection | null>(null))
const selectedNoteIdsAtom = historyAtom(atom<readonly number[]>([]))
const lastNoteDurationAtom = atom<number | null>(null)
const notGhostTrackIdsAtom = atom<ReadonlySet<TrackId>>(new Set<TrackId>())
const newNoteVelocityAtom = atom<number>(100)
const keySignatureAtom = atom<KeySignature | null>(null)
const openTransposeDialogAtom = atom<boolean>(false)
const previewingNoteNumbersAtom = atom<ReadonlySet<number>>(new Set<number>())
const activePaneAtom = atom<"notes" | "control" | null>(null)

// actions
const resetSelectionAtom = atom(null, (_get, set) => {
  set(selectionAtom, null)
  set(selectedNoteIdsAtom, [])
})
const addPreviewingNoteNumbersAtom = atom(
  null,
  (_get, set, noteNumber: number) =>
    set(previewingNoteNumbersAtom, addedSet(noteNumber)),
)
const removePreviewingNoteNumbersAtom = atom(
  null,
  (_get, set, noteNumber: number) =>
    set(previewingNoteNumbersAtom, deletedSet(noteNumber)),
)
const getSelectionAtom = atom(null, (get) => get(selectionAtom))
const getSelectedNoteIdsAtom = atom(null, (get) => get(selectedNoteIdsAtom))
const toggleToolAtom = atom(null, (_get, set) =>
  set(mouseModeAtom, (prev) => (prev === "pencil" ? "selection" : "pencil")),
)

// effects

// reset selection when change track or mouse mode
export const resetSelectionEffectAtom = atomEffect((get, set) => {
  // observe change track or mouse mode
  get(selectedTrackIdAtom)
  get(mouseModeAtom)

  set(selectionAtom, null)
  set(selectedNoteIdsAtom, [])
})
