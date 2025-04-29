import { useCallback } from "react"
import { KeySignature } from "../entities/scale/KeySignature"
import { Selection } from "../entities/selection/Selection"
import { PianoRollMouseMode } from "../stores/PianoRollStore"
import { TrackId } from "../track"
import { useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export function usePianoRoll() {
  const { pianoRollStore } = useStores()

  return {
    get canvasWidth() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.canvasWidth)
    },
    get cursorX() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.cursorX)
    },
    get enabledQuantizer() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.enabledQuantizer,
      )
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
    get scrollLeft() {
      return useMobxStore(({ pianoRollStore }) => pianoRollStore.scrollLeft)
    },
    get scrollLeftTicks() {
      return useMobxStore(
        ({ pianoRollStore }) => pianoRollStore.scrollLeftTicks,
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
    resetSelection: useCallback(
      () => pianoRollStore.resetSelection(),
      [pianoRollStore],
    ),
    scrollBy: useCallback(
      (dx: number, dy: number) => pianoRollStore.scrollBy(dx, dy),
      [pianoRollStore],
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
      (mode: PianoRollMouseMode) => (pianoRollStore.mouseMode = mode),
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
    setScrollLeftInTicks: useCallback(
      (scrollLeft: number) => pianoRollStore.setScrollLeftInTicks(scrollLeft),
      [pianoRollStore],
    ),
    setScrollLeftInPixels: useCallback(
      (scrollLeft: number) => pianoRollStore.setScrollLeftInPixels(scrollLeft),
      [pianoRollStore],
    ),
    setSelectedTrackId: useCallback(
      (id: TrackId) => (pianoRollStore.selectedTrackId = id),
      [pianoRollStore],
    ),
    setSelectedTrackIndex: useCallback(
      (index: number) => (pianoRollStore.selectedTrackIndex = index),
      [pianoRollStore],
    ),
    setSelectedNoteIds: useCallback(
      (ids: number[]) => (pianoRollStore.selectedNoteIds = ids),
      [pianoRollStore],
    ),
  }
}
