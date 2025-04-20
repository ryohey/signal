import { useCallback, useMemo } from "react"
import { Point } from "../entities/geometry/Point"
import { Rect } from "../entities/geometry/Rect"
import { TempoSelection } from "../entities/selection/TempoSelection"
import { PianoRollMouseMode } from "../stores/PianoRollStore"
import { useMobxSelector, useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export function useTempoEditor() {
  const { tempoEditorStore } = useStores()
  const { rulerStore } = tempoEditorStore

  const selection = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.selection,
  )
  const transform = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.transform,
  )
  const items = useMobxStore(({ tempoEditorStore }) => tempoEditorStore.items)
  const controlPoints = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.controlPoints,
  )
  const scrollLeft = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.scrollLeft,
  )
  const quantizer = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.quantizer,
  )
  const selectedEventIds = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.selectedEventIds,
  )
  const mouseMode = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.mouseMode,
  )
  const beats = useMobxSelector(() => rulerStore.beats, [rulerStore])
  const cursorX = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.cursorX,
  )
  const contentWidth = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.contentWidth,
  )

  const selectionRect = useMemo(
    () =>
      selection != null ? TempoSelection.getBounds(selection, transform) : null,
    [selection, transform],
  )

  const hitTest = useCallback(
    (point: Point) => {
      return controlPoints.find((r) => Rect.containsPoint(r, point))?.id
    },
    [controlPoints],
  )

  return {
    selectionRect,
    controlPoints,
    hitTest,
    items,
    transform,
    scrollLeft,
    quantizer,
    selectedEventIds,
    mouseMode,
    beats,
    cursorX,
    contentWidth,
    rulerStore,
    setSelection: useCallback((selection: TempoSelection | null) => {
      tempoEditorStore.selection = selection
    }, []),
    setSelectedEventIds: useCallback((ids: number[]) => {
      tempoEditorStore.selectedEventIds = ids
    }, []),
    setScrollLeftInPixels: useCallback((scrollLeft: number) => {
      tempoEditorStore.setScrollLeftInPixels(scrollLeft)
    }, []),
    setAutoScroll: useCallback((autoScroll: boolean) => {
      tempoEditorStore.autoScroll = autoScroll
    }, []),
    setMouseMode: useCallback((mode: PianoRollMouseMode) => {
      tempoEditorStore.mouseMode = mode
    }, []),
    setCanvasWidth: useCallback((width: number) => {
      tempoEditorStore.canvasWidth = width
    }, []),
    setCanvasHeight: useCallback((height: number) => {
      tempoEditorStore.canvasHeight = height
    }, []),
  }
}
