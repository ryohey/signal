import { deserializeSingleEvent, Stream } from "midifile-ts"
import { autorun } from "mobx"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react"
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
import { useMobxGetter } from "./useMobxSelector"
import { QuantizerProvider, useQuantizer } from "./useQuantizer"
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    [midiInput, pianoRollStore],
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
  const { tickScrollStore, keyScrollStore, rulerStore, quantizerStore } =
    useContext(PianoRollStoreContext)

  return (
    <TickScrollProvider value={tickScrollStore}>
      <KeyScrollProvider value={keyScrollStore}>
        <RulerProvider value={rulerStore}>
          <QuantizerProvider value={quantizerStore}>
            {children}
          </QuantizerProvider>
        </RulerProvider>
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
      return useMobxGetter(pianoRollStore, "currentPan")
    },
    get currentVolume() {
      return useMobxGetter(pianoRollStore, "currentVolume")
    },
    get notes() {
      return useMobxGetter(pianoRollStore, "notes")
    },
    get notGhostTrackIds() {
      return useMobxGetter(pianoRollStore, "notGhostTrackIds")
    },
    get rulerStore() {
      return useMobxGetter(pianoRollStore, "rulerStore")
    },
    get mouseMode() {
      return useMobxGetter(pianoRollStore, "mouseMode")
    },
    get keySignature() {
      return useMobxGetter(pianoRollStore, "keySignature")
    },
    get selection() {
      return useMobxGetter(pianoRollStore, "selection")
    },
    get selectedTrack() {
      return useMobxGetter(pianoRollStore, "selectedTrack")
    },
    get selectedTrackId() {
      return useMobxGetter(pianoRollStore, "selectedTrackId")
    },
    get selectedTrackIndex() {
      return useMobxGetter(pianoRollStore, "selectedTrackIndex")
    },
    get selectedNoteIds() {
      return useMobxGetter(pianoRollStore, "selectedNoteIds")
    },
    get transform() {
      return useMobxGetter(pianoRollStore, "transform")
    },
    get windowedEvents() {
      return useMobxGetter(pianoRollStore, "windowedEvents")
    },
    get selectionBounds() {
      return useMobxGetter(pianoRollStore, "selectionBounds")
    },
    get showTrackList() {
      return useMobxGetter(pianoRollStore, "showTrackList")
    },
    get showEventList() {
      return useMobxGetter(pianoRollStore, "showEventList")
    },
    get ghostTrackIds() {
      return useMobxGetter(pianoRollStore, "ghostTrackIds")
    },
    get previewingNoteNumbers() {
      return useMobxGetter(pianoRollStore, "previewingNoteNumbers")
    },
    get openTransposeDialog() {
      return useMobxGetter(pianoRollStore, "openTransposeDialog")
    },
    get openVelocityDialog() {
      return useMobxGetter(pianoRollStore, "openVelocityDialog")
    },
    get newNoteVelocity() {
      return useMobxGetter(pianoRollStore, "newNoteVelocity")
    },
    get lastNoteDuration() {
      return useMobxGetter(pianoRollStore, "lastNoteDuration")
    },
    get currentMBTTime() {
      return useMobxGetter(pianoRollStore, "currentMBTTime")
    },
    get controlCursor() {
      return useMobxGetter(pianoRollStore, "controlCursor")
    },
    get activePane() {
      return useMobxGetter(pianoRollStore, "activePane")
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
    setOpenTransposeDialog: useCallback(
      (open: boolean) => (pianoRollStore.openTransposeDialog = open),
      [pianoRollStore],
    ),
    setOpenVelocityDialog: useCallback(
      (open: boolean) => (pianoRollStore.openVelocityDialog = open),
      [pianoRollStore],
    ),
    setKeySignature: useCallback(
      (keySignature: KeySignature | null) =>
        (pianoRollStore.keySignature = keySignature),
      [pianoRollStore],
    ),
    setMouseMode: useCallback(
      (mode: PianoRollMouseMode) => {
        pianoRollStore.mouseMode = mode
      },
      [pianoRollStore],
    ),
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
    setShowTrackList: useCallback(
      (show: boolean) => (pianoRollStore.showTrackList = show),
      [pianoRollStore],
    ),
    setShowEventList: useCallback(
      (show: boolean) => (pianoRollStore.showEventList = show),
      [pianoRollStore],
    ),
    setScrollLeftInTicks,
    setScrollLeftInPixels,
    setSelectedTrackId: useCallback(
      (id: TrackId) => (pianoRollStore.selectedTrackId = id),
      [pianoRollStore],
    ),
    setSelectedTrackIndex: useCallback(
      (index: number) =>
        (pianoRollStore.selectedTrackId = songStore.song.tracks[index]?.id),
      [pianoRollStore, songStore.song.tracks],
    ),
    setSelectedNoteIds: useCallback(
      (ids: number[]) => (pianoRollStore.selectedNoteIds = ids),
      [pianoRollStore],
    ),
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
    setLastNoteDuration: useCallback(
      (duration: number | null) => (pianoRollStore.lastNoteDuration = duration),
      [pianoRollStore],
    ),
    toggleTool: useCallback(
      () =>
        (pianoRollStore.mouseMode =
          pianoRollStore.mouseMode === "pencil" ? "selection" : "pencil"),
      [pianoRollStore],
    ),
    setNewNoteVelocity: useCallback(
      (velocity: number) => (pianoRollStore.newNoteVelocity = velocity),
      [pianoRollStore],
    ),
    setActivePane: useCallback(
      (pane: "notes" | "control" | null) => (pianoRollStore.activePane = pane),
      [pianoRollStore],
    ),
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

export function usePianoRollQuantizer() {
  const { quantizerStore } = useContext(PianoRollStoreContext)
  return useQuantizer(quantizerStore)
}
