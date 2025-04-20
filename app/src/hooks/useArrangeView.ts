import { useCallback } from "react"
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
  const selectedEventIds = useMobxStore(
    ({ arrangeViewStore }) => arrangeViewStore.selectedEventIds,
  )
  const tracks = useMobxStore(({ song }) => song.tracks)

  return {
    tracks,
    autoScroll,
    canvasWidth,
    canvasHeight,
    scaleX,
    scaleY,
    trackHeight,
    contentWidth,
    contentHeight,
    transform,
    scrollLeft,
    scrollTop,
    selectedTrackIndex,
    selectedTrackId,
    selectedEventIds,
    rulerStore: arrangeViewStore.rulerStore,
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
    setSelectedEventIds: useCallback(
      (ids: { [trackIndex: number]: number[] } = {}) => {
        arrangeViewStore.selectedEventIds = ids
      },
      [],
    ),
    setAutoScroll: useCallback((value: boolean) => {
      arrangeViewStore.autoScroll = value
    }, []),
  }
}
