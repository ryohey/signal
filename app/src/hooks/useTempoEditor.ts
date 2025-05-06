import { useCallback, useMemo } from "react"
import { TempoSelection } from "../entities/selection/TempoSelection"
import { PianoRollMouseMode } from "../stores/PianoRollStore"
import { useMobxStore } from "./useMobxSelector"
import { usePlayer } from "./usePlayer"
import { useRuler } from "./useRuler"
import { useStores } from "./useStores"

export function useTempoEditor() {
  const { tempoEditorStore } = useStores()

  const selection = useMobxStore(
    ({ tempoEditorStore }) => tempoEditorStore.selection,
  )
  const { beats } = useRuler()
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
    selection,
    transform,
    selectionRect,
    beats,
    cursor,
    cursorX,
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
