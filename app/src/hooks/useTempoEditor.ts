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

  return {
    controlPoints,
    selection,
    transform,
    selectionRect,
    beats,
    cursorX,
    rulerStore,
    get autoScroll() {
      return useMobxStore(({ tempoEditorStore }) => tempoEditorStore.autoScroll)
    },
    get cursor() {
      return useMobxStore(({ tempoEditorStore }) => tempoEditorStore.cursor)
    },
    get items() {
      return useMobxStore(({ tempoEditorStore }) => tempoEditorStore.items)
    },
    get scrollLeft() {
      return useMobxStore(({ tempoEditorStore }) => tempoEditorStore.scrollLeft)
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
