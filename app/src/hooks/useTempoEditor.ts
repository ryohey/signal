import { useCallback, useMemo } from "react"
import { Point } from "../entities/geometry/Point"
import { Rect } from "../entities/geometry/Rect"
import { TempoSelection } from "../entities/selection/TempoSelection"
import { PianoRollMouseMode } from "../stores/PianoRollStore"
import { useMobxSelector, useMobxStore } from "./useMobxSelector"
import { usePlayer } from "./usePlayer"
import { useStores } from "./useStores"

export function useTempoEditor() {
  const { tempoEditorStore } = useStores()
  const { rulerStore } = tempoEditorStore

  const controlPoints = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.controlPoints,
  )
  const selection = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.selection,
  )
  const beats = useMobxSelector(() => rulerStore.beats, [rulerStore])
  const transform = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.transform,
  )
  const mouseMode = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.mouseMode,
  )

  const { position: playerPosition } = usePlayer()

  const selectionRect = useMemo(
    () =>
      selection != null ? TempoSelection.getBounds(selection, transform) : null,
    [selection, transform],
  )

  const cursorX = useMemo(
    () => transform.getX(playerPosition),
    [transform, playerPosition],
  )

  const cursor = useMemo(
    () =>
      mouseMode === "pencil"
        ? `url("./cursor-pencil.svg") 0 20, pointer`
        : "auto",
    [mouseMode],
  )

  return {
    controlPoints,
    selection,
    transform,
    selectionRect,
    beats,
    cursor,
    cursorX,
    get items() {
      return useMobxStore(({ tempoEditorStore }) => tempoEditorStore.items)
    },
    get quantizer() {
      return useMobxStore(({ tempoEditorStore }) => tempoEditorStore.quantizer)
    },
    get selectedEventIds() {
      return useMobxStore(
        ({ tempoEditorStore }) => tempoEditorStore.selectedEventIds,
      )
    },
    get mouseMode() {
      return useMobxStore(({ tempoEditorStore }) => tempoEditorStore.mouseMode)
    },
    get isQuantizeEnabled() {
      return useMobxStore(
        ({ tempoEditorStore }) => tempoEditorStore.isQuantizeEnabled,
      )
    },
    get quantize() {
      return useMobxStore(({ tempoEditorStore }) => tempoEditorStore.quantize)
    },
    get contentWidth() {
      return useMobxStore(
        ({ tempoEditorStore: { tickScrollStore } }) =>
          tickScrollStore.contentWidth,
      )
    },
    hitTest: useCallback(
      (point: Point) => {
        return controlPoints.find((r) => Rect.containsPoint(r, point))?.id
      },
      [controlPoints],
    ),
    setSelection: useCallback((selection: TempoSelection | null) => {
      tempoEditorStore.selection = selection
    }, []),
    setSelectedEventIds: useCallback((ids: number[]) => {
      tempoEditorStore.selectedEventIds = ids
    }, []),
    setMouseMode: useCallback((mode: PianoRollMouseMode) => {
      tempoEditorStore.mouseMode = mode
    }, []),
    setCanvasHeight: useCallback((height: number) => {
      tempoEditorStore.canvasHeight = height
    }, []),
    setQuantize: useCallback((quantize: number) => {
      tempoEditorStore.quantize = quantize
    }, []),
    setQuantizeEnabled: useCallback((isEnabled: boolean) => {
      tempoEditorStore.isQuantizeEnabled = isEnabled
    }, []),
  }
}
