import { atom, useAtomValue, useSetAtom } from "jotai"
import { useAtomCallback } from "jotai/utils"
import { deserializeSingleEvent, Stream } from "midifile-ts"
import { autorun } from "mobx"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react"
import { InstrumentSetting } from "../components/InstrumentBrowser/InstrumentBrowser"
import { Point } from "../entities/geometry/Point"
import { Rect } from "../entities/geometry/Rect"
import { KeySignature } from "../entities/scale/KeySignature"
import { Selection } from "../entities/selection/Selection"
import { addedSet, deletedSet } from "../helpers/set"
import PianoRollStore, {
  PianoNoteItem,
  PianoRollMouseMode,
  SerializedPianoRollStore,
} from "../stores/PianoRollStore"
import { TrackId, UNASSIGNED_TRACK_ID } from "../track"
import { KeyScrollProvider, useKeyScroll } from "./useKeyScroll"
import { useMobxSelector } from "./useMobxSelector"
import { RulerProvider } from "./useRuler"
import { useStores } from "./useStores"
import { TickScrollProvider, useTickScroll } from "./useTickScroll"

const PianoRollStoreContext = createContext<PianoRollStore>(null!)

export function PianoRollProvider({ children }: { children: React.ReactNode }) {
  const { songStore, player, midiInput, midiMonitor, midiRecorder } =
    useStores()

  const pianoRollStore = useMemo(
    () => new PianoRollStore(songStore, player),
    [songStore, player],
  )

  useEffect(() => {
    pianoRollStore.setUpAutorun()
  }, [pianoRollStore])

  // Initially select the first track that is not a conductor track
  useEffect(() => {
    pianoRollStore.selectedTrackId =
      songStore.song.tracks.find((t) => !t.isConductorTrack)?.id ??
      UNASSIGNED_TRACK_ID
  }, [pianoRollStore])

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
          pianoRollStore.previewingNoteNumbers = addedSet(
            pianoRollStore.previewingNoteNumbers,
            event.noteNumber,
          )
        } else if (event.subtype === "noteOff") {
          pianoRollStore.previewingNoteNumbers = deletedSet(
            pianoRollStore.previewingNoteNumbers,
            event.noteNumber,
          )
        }
      }),
    [pianoRollStore],
  )

  // sync MIDIMonitor channel with selected track
  useEffect(
    () =>
      autorun(() => {
        const track = pianoRollStore.selectedTrack
        midiMonitor.channel = track?.channel ?? 0
      }),
    [pianoRollStore, midiMonitor],
  )

  // sync MIDIRecorder channel with selected track
  useEffect(
    () =>
      autorun(() => {
        midiRecorder.trackId = pianoRollStore.selectedTrackId
      }),
    [pianoRollStore, midiRecorder],
  )

  return (
    <PianoRollStoreContext.Provider value={pianoRollStore}>
      {children}
    </PianoRollStoreContext.Provider>
  )
}

export function PianoRollScope({ children }: { children: React.ReactNode }) {
  const { tickScrollStore, keyScrollStore, rulerStore } = useContext(
    PianoRollStoreContext,
  )

  return (
    <TickScrollProvider value={tickScrollStore}>
      <KeyScrollProvider value={keyScrollStore}>
        <RulerProvider value={rulerStore}>{children}</RulerProvider>
      </KeyScrollProvider>
    </TickScrollProvider>
  )
}

export function usePianoRoll() {
  const pianoRollStore = useContext(PianoRollStoreContext)
  const { songStore } = useStores()
  const { tickScrollStore, keyScrollStore } = pianoRollStore
  const { setScrollLeftInTicks, setScrollLeftInPixels } =
    useTickScroll(tickScrollStore)
  const { setScrollTopInPixels } = useKeyScroll(keyScrollStore)

  return {
    get currentPan() {
      return useMobxSelector(() => pianoRollStore.currentPan, [pianoRollStore])
    },
    get currentVolume() {
      return useMobxSelector(
        () => pianoRollStore.currentVolume,
        [pianoRollStore],
      )
    },
    get enabledQuantizer() {
      return useMobxSelector(
        () => pianoRollStore.enabledQuantizer,
        [pianoRollStore],
      )
    },
    get notes() {
      return useMobxSelector(() => pianoRollStore.notes, [pianoRollStore])
    },
    get notGhostTrackIds() {
      return useMobxSelector(
        () => pianoRollStore.notGhostTrackIds,
        [pianoRollStore],
      )
    },
    get rulerStore() {
      return useMobxSelector(() => pianoRollStore.rulerStore, [pianoRollStore])
    },
    get mouseMode() {
      return useAtomValue(mouseModeAtom)
    },
    get keySignature() {
      return useAtomValue(keySignatureAtom)
    },
    get selection() {
      return useMobxSelector(() => pianoRollStore.selection, [pianoRollStore])
    },
    get selectedTrack() {
      return useMobxSelector(
        () => pianoRollStore.selectedTrack,
        [pianoRollStore],
      )
    },
    get selectedTrackId() {
      return useMobxSelector(
        () => pianoRollStore.selectedTrackId,
        [pianoRollStore],
      )
    },
    get selectedTrackIndex() {
      return useMobxSelector(
        () => pianoRollStore.selectedTrackIndex,
        [pianoRollStore],
      )
    },
    get selectedNoteIds() {
      return useMobxSelector(
        () => pianoRollStore.selectedNoteIds,
        [pianoRollStore],
      )
    },
    get transform() {
      return useMobxSelector(() => pianoRollStore.transform, [pianoRollStore])
    },
    get windowedEvents() {
      return useMobxSelector(
        () => pianoRollStore.windowedEvents,
        [pianoRollStore],
      )
    },
    get quantizer() {
      return useMobxSelector(() => pianoRollStore.quantizer, [pianoRollStore])
    },
    get quantize() {
      return useMobxSelector(() => pianoRollStore.quantize, [pianoRollStore])
    },
    get notesCursor() {
      return useAtomValue(notesCursorAtom)
    },
    get selectionBounds() {
      return useMobxSelector(
        () => pianoRollStore.selectionBounds,
        [pianoRollStore],
      )
    },
    get showTrackList() {
      return useAtomValue(showTrackListAtom)
    },
    get showEventList() {
      return useAtomValue(showEventListAtom)
    },
    get ghostTrackIds() {
      return useMobxSelector(
        () => pianoRollStore.ghostTrackIds,
        [pianoRollStore],
      )
    },
    get previewingNoteNumbers() {
      return useMobxSelector(
        () => pianoRollStore.previewingNoteNumbers,
        [pianoRollStore],
      )
    },
    get openTransposeDialog() {
      return useAtomValue(openTransposeDialogAtom)
    },
    get openVelocityDialog() {
      return useAtomValue(openVelocityDialogAtom)
    },
    get newNoteVelocity() {
      return useAtomValue(newNoteVelocityAtom)
    },
    get lastNoteDuration() {
      return useAtomValue(lastNoteDurationAtom)
    },
    get isQuantizeEnabled() {
      return useMobxSelector(
        () => pianoRollStore.isQuantizeEnabled,
        [pianoRollStore],
      )
    },
    get currentMBTTime() {
      return useMobxSelector(
        () => pianoRollStore.currentMBTTime,
        [pianoRollStore],
      )
    },
    get controlCursor() {
      return useAtomValue(controlCursorAtom)
    },
    get instrumentBrowserSetting() {
      return useAtomValue(instrumentBrowserSettingAtom)
    },
    get openInstrumentBrowser() {
      return useAtomValue(openInstrumentBrowserAtom)
    },
    resetSelection: useCallback(() => {
      pianoRollStore.selection = null
      pianoRollStore.selectedNoteIds = []
    }, [pianoRollStore]),
    scrollBy: useCallback(
      (dx: number, dy: number) => {
        setScrollLeftInPixels(tickScrollStore.scrollLeft - dx)
        setScrollTopInPixels(keyScrollStore.scrollTop - dy)
      },
      [
        setScrollLeftInPixels,
        setScrollTopInPixels,
        keyScrollStore,
        tickScrollStore,
      ],
    ),
    setNotGhostTrackIds: useCallback(
      (ids: Set<TrackId>) => (pianoRollStore.notGhostTrackIds = ids),
      [pianoRollStore],
    ),
    setOpenTransposeDialog: useSetAtom(openTransposeDialogAtom),
    setOpenVelocityDialog: useSetAtom(openVelocityDialogAtom),
    setKeySignature: useSetAtom(keySignatureAtom),
    setMouseMode: useAtomCallback((_get, set, mode: PianoRollMouseMode) => {
      set(mouseModeAtom, mode)
      set(notesCursorAtom, mode === "pencil" ? "auto" : "crosshair")

      // reset selection when change mouse mode
      pianoRollStore.selection = null
      pianoRollStore.selectedNoteIds = []
    }),
    addPreviewingNoteNumbers: useCallback(
      (noteNumber: number) =>
        (pianoRollStore.previewingNoteNumbers = new Set([
          ...pianoRollStore.previewingNoteNumbers,
          noteNumber,
        ])),
      [pianoRollStore],
    ),
    removePreviewingNoteNumbers: useCallback(
      (noteNumber: number) =>
        (pianoRollStore.previewingNoteNumbers = new Set(
          [...pianoRollStore.previewingNoteNumbers].filter(
            (n) => n !== noteNumber,
          ),
        )),
      [pianoRollStore],
    ),
    setSelection: useCallback(
      (selection: Selection | null) => (pianoRollStore.selection = selection),
      [pianoRollStore],
    ),
    setShowTrackList: useSetAtom(showTrackListAtom),
    setShowEventList: useSetAtom(showEventListAtom),
    setScrollLeftInTicks,
    setScrollLeftInPixels,
    setSelectedTrackId: useCallback(
      (id: TrackId) => (pianoRollStore.selectedTrackId = id),
      [pianoRollStore],
    ),
    setSelectedTrackIndex: useCallback(
      (index: number) =>
        (pianoRollStore.selectedTrackId = songStore.song.tracks[index]?.id),
      [pianoRollStore],
    ),
    setSelectedNoteIds: useCallback(
      (ids: number[]) => (pianoRollStore.selectedNoteIds = ids),
      [pianoRollStore],
    ),
    setNotesCursor: useSetAtom(notesCursorAtom),
    // convert mouse position to the local coordinate on the canvas
    getLocal: useCallback(
      (e: { offsetX: number; offsetY: number }): Point => ({
        x: e.offsetX + tickScrollStore.scrollLeft,
        y: e.offsetY + keyScrollStore.scrollTop,
      }),
      [keyScrollStore, tickScrollStore],
    ),
    getNotes: useCallback(
      (local: Point): PianoNoteItem[] =>
        pianoRollStore.notes.filter((n) => Rect.containsPoint(n, local)),
      [pianoRollStore],
    ),
    getSelection: useCallback(() => pianoRollStore.selection, [pianoRollStore]),
    getSelectedTrack: useCallback(
      () => pianoRollStore.selectedTrack,
      [pianoRollStore],
    ),
    getSelectedNoteIds: useCallback(
      () => pianoRollStore.selectedNoteIds,
      [pianoRollStore],
    ),
    setLastNoteDuration: useSetAtom(lastNoteDurationAtom),
    toggleTool: useAtomCallback((_get, set) => {
      set(mouseModeAtom, (prev) => (prev === "pencil" ? "selection" : "pencil"))

      // reset selection when change mouse mode
      pianoRollStore.selection = null
      pianoRollStore.selectedNoteIds = []
    }),
    setNewNoteVelocity: useSetAtom(newNoteVelocityAtom),
    setQuantize: useCallback(
      (denominator: number) => (pianoRollStore.quantize = denominator),
      [pianoRollStore],
    ),
    setIsQuantizeEnabled: useCallback(
      (enabled: boolean) => (pianoRollStore.isQuantizeEnabled = enabled),
      [pianoRollStore],
    ),
    setInstrumentBrowserSetting: useSetAtom(instrumentBrowserSettingAtom),
    setOpenInstrumentBrowser: useSetAtom(openInstrumentBrowserAtom),
    serializeState: useCallback(
      () => pianoRollStore.serialize(),
      [pianoRollStore],
    ),
    restoreState: useCallback(
      (state: SerializedPianoRollStore) => pianoRollStore.restore(state),
      [pianoRollStore],
    ),
  }
}

export function usePianoRollTickScroll() {
  const { tickScrollStore } = useContext(PianoRollStoreContext)
  return useTickScroll(tickScrollStore)
}

// atoms

const mouseModeAtom = atom<PianoRollMouseMode>("pencil")
const showTrackListAtom = atom(false)
const showEventListAtom = atom(false)
const openTransposeDialogAtom = atom(false)
const openVelocityDialogAtom = atom(false)
const newNoteVelocityAtom = atom(100)
const keySignatureAtom = atom<KeySignature | null>(null)
const lastNoteDurationAtom = atom<number | null>(null)
const openInstrumentBrowserAtom = atom(false)
const instrumentBrowserSettingAtom = atom<InstrumentSetting>({
  isRhythmTrack: false,
  programNumber: 0,
})
const notesCursorAtom = atom("auto")

// derived atoms

const controlCursorAtom = atom((get) =>
  get(mouseModeAtom) === "pencil"
    ? `url("./cursor-pencil.svg") 0 20, pointer`
    : "auto",
)
