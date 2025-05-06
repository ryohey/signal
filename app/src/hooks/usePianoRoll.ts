import { useCallback } from "react"
import { InstrumentSetting } from "../components/InstrumentBrowser/InstrumentBrowser"
import { Point } from "../entities/geometry/Point"
import { Rect } from "../entities/geometry/Rect"
import { KeySignature } from "../entities/scale/KeySignature"
import { Selection } from "../entities/selection/Selection"
import { PianoNoteItem, PianoRollMouseMode } from "../stores/PianoRollStore"
import { TrackId } from "../track"
import { useKeyScroll } from "./useKeyScroll"
import { useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"
import { useTickScroll } from "./useTickScroll"

export function usePianoRoll() {
  const { pianoRollStore, songStore } = useStores()
  const { tickScrollStore, keyScrollStore } = pianoRollStore
  const { setScrollLeftInTicks, setScrollLeftInPixels } =
    useTickScroll(tickScrollStore)
  const { setScrollTopInPixels } = useKeyScroll(keyScrollStore)

  return {
    get currentPan() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.currentPan)
    },
    get currentVolume() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.currentVolume)
    },
    get enabledQuantizer() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.enabledQuantizer,
      )
    },
    get notes() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.notes)
    },
    get notGhostTrackIds() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.notGhostTrackIds,
      )
    },
    get rulerStore() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.rulerStore)
    },
    get mouseMode() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.mouseMode)
    },
    get keySignature() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.keySignature)
    },
    get selection() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.selection)
    },
    get selectedTrack() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.selectedTrack)
    },
    get selectedTrackId() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.selectedTrackId,
      )
    },
    get selectedTrackIndex() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.selectedTrackIndex,
      )
    },
    get selectedNoteIds() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.selectedNoteIds,
      )
    },
    get transform() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.transform)
    },
    get windowedEvents() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.windowedEvents)
    },
    get quantizer() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.quantizer)
    },
    get quantize() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.quantize)
    },
    get notesCursor() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.notesCursor)
    },
    get selectionBounds() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.selectionBounds,
      )
    },
    get showTrackList() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.showTrackList)
    },
    get showEventList() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.showEventList)
    },
    get ghostTrackIds() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.ghostTrackIds)
    },
    get previewingNoteNumbers() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.previewingNoteNumbers,
      )
    },
    get openTransposeDialog() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.openTransposeDialog,
      )
    },
    get openVelocityDialog() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.openVelocityDialog,
      )
    },
    get newNoteVelocity() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.newNoteVelocity,
      )
    },
    get lastNoteDuration() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.lastNoteDuration,
      )
    },
    get isQuantizeEnabled() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.isQuantizeEnabled,
      )
    },
    get currentMBTTime() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.currentMBTTime)
    },
    get controlCursor() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.controlCursor)
    },
    get instrumentBrowserSetting() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.instrumentBrowserSetting,
      )
    },
    get openInstrumentBrowser() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.openInstrumentBrowser,
      )
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
        pianoRollStore.notesCursor = mode === "pencil" ? "auto" : "crosshair"
      },
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
      [pianoRollStore],
    ),
    setSelectedNoteIds: useCallback(
      (ids: number[]) => (pianoRollStore.selectedNoteIds = ids),
      [pianoRollStore],
    ),
    setNotesCursor: useCallback(
      (cursor: string) => (pianoRollStore.notesCursor = cursor),
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
    setQuantize: useCallback(
      (denominator: number) => (pianoRollStore.quantize = denominator),
      [pianoRollStore],
    ),
    setIsQuantizeEnabled: useCallback(
      (enabled: boolean) => (pianoRollStore.isQuantizeEnabled = enabled),
      [pianoRollStore],
    ),
    setInstrumentBrowserSetting: useCallback(
      (setting: InstrumentSetting) =>
        (pianoRollStore.instrumentBrowserSetting = setting),
      [pianoRollStore],
    ),
    setOpenInstrumentBrowser: useCallback(
      (open: boolean) => (pianoRollStore.openInstrumentBrowser = open),
      [pianoRollStore],
    ),
  }
}
