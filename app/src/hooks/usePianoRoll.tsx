import { TrackId, UNASSIGNED_TRACK_ID } from "@signal-app/core"
import { atom, useAtom, useAtomValue, useSetAtom, useStore } from "jotai"
import { atomEffect } from "jotai-effect"
import { useAtomCallback } from "jotai/utils"
import { Store } from "jotai/vanilla/store"
import { cloneDeep, isEqual } from "lodash"
import { deserializeSingleEvent, Stream } from "midifile-ts"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react"
import { Point } from "../entities/geometry/Point"
import { KeySignature } from "../entities/scale/KeySignature"
import { Selection } from "../entities/selection/Selection"
import { NoteCoordTransform } from "../entities/transform/NoteCoordTransform"
import { addedSet, deletedSet } from "../helpers/set"
import { BeatsProvider, createBeatsScope } from "./useBeats"
import { EventViewProvider } from "./useEventView"
import { useKeyScroll } from "./useKeyScroll"
import { useMobxSelector } from "./useMobxSelector"
import {
  createQuantizerScope,
  QuantizerProvider,
  useQuantizer,
} from "./useQuantizer"
import { useStores } from "./useStores"
import {
  createTickScrollScope,
  TickScrollProvider,
  useTickScroll,
} from "./useTickScroll"

type PianoRollStore = {
  quantizerScope: Store
  tickScrollScope: Store
  beatsScope: Store
}

const PianoRollStoreContext = createContext<PianoRollStore>(null!)

export function PianoRollProvider({ children }: { children: React.ReactNode }) {
  const store = useStore()

  const pianoRollStore = useMemo(() => {
    // should match the order in PianoRollScope
    const tickScrollScope = createTickScrollScope(store)
    const quantizerScope = createQuantizerScope(tickScrollScope)
    const beatsScope = createBeatsScope(quantizerScope)
    return {
      quantizerScope,
      tickScrollScope,
      beatsScope,
    }
  }, [store])

  return (
    <PianoRollStoreContext.Provider value={pianoRollStore}>
      <PianoRollProviderInner>{children}</PianoRollProviderInner>
    </PianoRollStoreContext.Provider>
  )
}

function PianoRollProviderInner({ children }: { children: React.ReactNode }) {
  const { songStore, midiInput, midiMonitor, midiRecorder } = useStores()
  const store = useStore()
  const {
    addPreviewingNoteNumbers,
    removePreviewingNoteNumbers,
    selectedTrack,
    selectedTrackId,
    setSelectedTrackId,
  } = usePianoRoll()

  useAtom(resetSelectionEffectAtom, { store })

  // Initially select the first track that is not a conductor track
  useEffect(() => {
    setSelectedTrackId(
      songStore.song.tracks.find((t) => !t.isConductorTrack)?.id ??
        UNASSIGNED_TRACK_ID,
    )
  }, [setSelectedTrackId, songStore])

  // highlight notes when receiving MIDI input
  useEffect(
    () =>
      midiInput.on("midiMessage", (e) => {
        const stream = new Stream(e.data)
        const event = deserializeSingleEvent(stream)

        if (event.type !== "channel") {
          return
        }

        if (event.subtype === "noteOn") {
          addPreviewingNoteNumbers(event.noteNumber)
        } else if (event.subtype === "noteOff") {
          removePreviewingNoteNumbers(event.noteNumber)
        }
      }),
    [midiInput, addPreviewingNoteNumbers, removePreviewingNoteNumbers],
  )

  // sync MIDIMonitor channel with selected track
  useEffect(() => {
    midiMonitor.channel = selectedTrack?.channel ?? 0
  }, [midiMonitor, selectedTrack])

  // sync MIDIRecorder channel with selected track
  useEffect(() => {
    midiRecorder.trackId = selectedTrackId ?? UNASSIGNED_TRACK_ID
  }, [midiRecorder, selectedTrackId])

  return children
}

export function PianoRollScope({ children }: { children: React.ReactNode }) {
  const { quantizerScope, tickScrollScope, beatsScope } = useContext(
    PianoRollStoreContext,
  )
  const { selectedTrackId } = usePianoRoll()

  return (
    <TickScrollProvider scope={tickScrollScope} minScaleX={0.15} maxScaleX={15}>
      <EventViewProvider trackId={selectedTrackId}>
        <QuantizerProvider scope={quantizerScope} quantize={8}>
          <BeatsProvider scope={beatsScope}>{children}</BeatsProvider>
        </QuantizerProvider>
      </EventViewProvider>
    </TickScrollProvider>
  )
}

export function usePianoRoll() {
  const { songStore } = useStores()
  const { tickScrollScope } = useContext(PianoRollStoreContext)
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
    get selectedTrack() {
      const selectedTrackId = useAtomValue(selectedTrackIdAtom, { store })
      return useMobxSelector(
        () => songStore.song.getTrack(selectedTrackId),
        [songStore, selectedTrackId],
      )
    },
    get selectedTrackId() {
      return useAtomValue(selectedTrackIdAtom, { store })
    },
    get selectedTrackIndex() {
      const selectedTrackId = useAtomValue(selectedTrackIdAtom, { store })
      return useMobxSelector(
        () => songStore.song.tracks.findIndex((t) => t.id === selectedTrackId),
        [songStore, selectedTrackId],
      )
    },
    get selectedNoteIds() {
      return useAtomValue(selectedNoteIdsAtom, { store })
    },
    get transform() {
      const { transform: tickTransform } = useTickScroll(tickScrollScope)
      const { transform: keyTransform } = useKeyScroll()
      return useMemo(
        () => new NoteCoordTransform(tickTransform, keyTransform),
        [tickTransform, keyTransform],
      )
    },
    get ghostTrackIds() {
      const notGhostTrackIds = useAtomValue(notGhostTrackIdsAtom, { store })
      const selectedTrackId = useAtomValue(selectedTrackIdAtom, { store })
      const allTrackIds = useMobxSelector(
        () => songStore.song.tracks.map((track) => track.id),
        [songStore.song.tracks],
        isEqual,
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
    get openVelocityDialog() {
      return useAtomValue(openVelocityDialogAtom, { store })
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
    get scrollBy() {
      const { setScrollLeftInPixels } = useTickScroll(tickScrollScope)
      const { setScrollTopInPixels } = useKeyScroll()
      return useCallback(
        (dx: number, dy: number) => {
          setScrollLeftInPixels((prev) => prev - dx)
          setScrollTopInPixels((prev) => prev - dy)
        },
        [setScrollLeftInPixels, setScrollTopInPixels],
      )
    },
    setNotGhostTrackIds: useSetAtom(notGhostTrackIdsAtom, { store }),
    setOpenTransposeDialog: useSetAtom(openTransposeDialogAtom, { store }),
    setOpenVelocityDialog: useSetAtom(openVelocityDialogAtom, { store }),
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
    // convert mouse position to the local coordinate on the canvas
    get getLocal() {
      const { scrollLeft } = useTickScroll()
      const { scrollTop } = useKeyScroll()
      return useCallback(
        (e: { offsetX: number; offsetY: number }): Point => ({
          x: e.offsetX + scrollLeft,
          y: e.offsetY + scrollTop,
        }),
        [scrollLeft, scrollTop],
      )
    },
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
    serializeState: useSetAtom(serializeAtom, { store }),
    restoreState: useSetAtom(restoreAtom, { store }),
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
const selectedTrackIdAtom = atom<TrackId>(UNASSIGNED_TRACK_ID)
const selectionAtom = atom<Selection | null>(null)
const selectedNoteIdsAtom = atom<number[]>([])
const lastNoteDurationAtom = atom<number | null>(null)
const notGhostTrackIdsAtom = atom<ReadonlySet<TrackId>>(new Set<TrackId>())
const newNoteVelocityAtom = atom<number>(100)
const keySignatureAtom = atom<KeySignature | null>(null)
const openTransposeDialogAtom = atom<boolean>(false)
const openVelocityDialogAtom = atom<boolean>(false)
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
const toggleToolAtom = atom(null, (get, set) =>
  set(mouseModeAtom, (prev) => (prev === "pencil" ? "selection" : "pencil")),
)
const serializeAtom = atom(null, (get) => ({
  selection: cloneDeep(get(selectionAtom)),
  selectedNoteIds: cloneDeep(get(selectedNoteIdsAtom)),
  selectedTrackId: get(selectedTrackIdAtom),
}))
const restoreAtom = atom(
  null,
  (
    _get,
    set,
    {
      selection,
      selectedNoteIds,
      selectedTrackId,
    }: {
      selection: Selection | null
      selectedNoteIds: number[]
      selectedTrackId: TrackId
    },
  ) => {
    set(selectionAtom, selection)
    set(selectedNoteIdsAtom, selectedNoteIds)
    set(selectedTrackIdAtom, selectedTrackId)
  },
)

// effects

// reset selection when change track or mouse mode
const resetSelectionEffectAtom = atomEffect((get, set) => {
  // observe change track or mouse mode
  get(selectedTrackIdAtom)
  get(mouseModeAtom)

  set(selectionAtom, null)
  set(selectedNoteIdsAtom, [])
})
