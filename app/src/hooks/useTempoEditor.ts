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
  const { rulerStore, tickScrollStore } = tempoEditorStore

  const autoScroll = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.autoScroll,
  )
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
  const isQuantizeEnabled = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.isQuantizeEnabled,
  )
  const quantize = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.quantize,
  )
  const beats = useMobxSelector(() => rulerStore.beats, [rulerStore])
  const contentWidth = useMobxStore(
    ({ tempoEditorStore: { tickScrollStore } }) => tickScrollStore.contentWidth,
  )
  const { position: playerPosition } = usePlayer()

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

  const cursorX = useMemo(
    () => transform.getX(playerPosition),
    [transform, playerPosition],
  )

  return {
    autoScroll,
    selectionRect,
    controlPoints,
    hitTest,
    items,
    transform,
    scrollLeft,
    quantizer,
    isQuantizeEnabled,
    quantize,
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
      tickScrollStore.setScrollLeftInPixels(scrollLeft)
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
    setQuantize: useCallback((quantize: number) => {
      tempoEditorStore.quantize = quantize
    }, []),
    setQuantizeEnabled: useCallback((isEnabled: boolean) => {
      tempoEditorStore.isQuantizeEnabled = isEnabled
    }, []),
  }
}
