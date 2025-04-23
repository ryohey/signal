import { useCallback } from "react"
import { ArrangeSelection } from "../entities/selection/ArrangeSelection"
import { useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export function useArrangeView() {
  const { arrangeViewStore } = useStores()

  const autoScroll = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.autoScroll,
  )
  const canvasWidth = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.canvasWidth,
  )
  const canvasHeight = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.canvasHeight,
  )
  const cursorX = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.cursorX,
  )
  const scaleX = useMobxStore(({ arrangeViewStore }) => arrangeViewStore.scaleX)
  const scaleY = useMobxStore(({ arrangeViewStore }) => arrangeViewStore.scaleY)
  const trackHeight = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.trackHeight,
  )
  const contentWidth = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.contentWidth,
  )
  const contentHeight = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.contentHeight,
  )
  const notes = useMobxStore(({ arrangeViewStore }) => arrangeViewStore.notes)
  const transform = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.transform,
  )
  const scrollLeft = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.scrollLeft,
  )
  const scrollTop = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.scrollTop,
  )
  const selectedTrackIndex = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.selectedTrackIndex,
  )
  const selectedTrackId = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.selectedTrackId,
  )
  const selection = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.selection,
  )
  const selectionRect = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.selectionRect,
  )
  const selectedEventIds = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.selectedEventIds,
  )
  const tracks = useMobxStore(({ song }) => song.tracks)
  const quantize = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.quantize,
  )
  const quantizer = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.quantizer,
  )
  const trackTransform = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.trackTransform,
  )
  const openTransposeDialog = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.openTransposeDialog,
  )
  const openVelocityDialog = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.openVelocityDialog,
  )

  return {
    tracks,
    autoScroll,
    canvasWidth,
    canvasHeight,
    cursorX,
    notes,
    scaleX,
    scaleY,
    trackHeight,
    contentWidth,
    contentHeight,
    transform,
    trackTransform,
    scrollLeft,
    scrollTop,
    selectedTrackIndex,
    selectedTrackId,
    selection,
    selectionRect,
    selectedEventIds,
    rulerStore: arrangeViewStore.rulerStore,
    quantize,
    quantizer,
    openTransposeDialog,
    openVelocityDialog,
    setCanvasWidth: useCallback((width: number) => {
      arrangeViewStore.canvasWidth = width
    }, []),
    setCanvasHeight: useCallback((height: number) => {
      arrangeViewStore.canvasHeight = height
    }, []),
    setScaleX: useCallback((scaleX: number) => {
      arrangeViewStore.scaleX = scaleX
    }, []),
    setScaleY: useCallback((scaleY: number) => {
      arrangeViewStore.setScaleY(scaleY)
    }, []),
    scaleAroundPointX: useCallback((scale: number, x: number) => {
      arrangeViewStore.scaleAroundPointX(scale, x)
    }, []),
    scrollBy: useCallback((x: number, y: number) => {
      arrangeViewStore.scrollBy(x, y)
    }, []),
    setScrollLeftInPixels: useCallback((x: number) => {
      arrangeViewStore.setScrollLeftInPixels(x)
    }, []),
    setScrollTop: useCallback((value: number) => {
      arrangeViewStore.setScrollTop(value)
    }, []),
    setSelectedTrackIndex: useCallback((index: number) => {
      arrangeViewStore.selectedTrackIndex = index
    }, []),
    setSelection: useCallback((selection: ArrangeSelection | null) => {
      arrangeViewStore.selection = selection
    }, []),
    setSelectedEventIds: useCallback(
      (ids: { [trackIndex: number]: number[] } = {}) => {
        arrangeViewStore.selectedEventIds = ids
      },
      [],
    ),
    setAutoScroll: useCallback((value: boolean) => {
      arrangeViewStore.autoScroll = value
    }, []),
    setQuantize: useCallback((value: number) => {
      arrangeViewStore.quantize = value
    }, []),
    resetSelection: useCallback(() => {
      arrangeViewStore.selection = null
      arrangeViewStore.selectedEventIds = {}
    }, []),
    setOpenTransposeDialog: useCallback((value: boolean) => {
      arrangeViewStore.openTransposeDialog = value
    }, []),
    setOpenVelocityDialog: useCallback((value: boolean) => {
      arrangeViewStore.openVelocityDialog = value
    }, []),
  }
}
