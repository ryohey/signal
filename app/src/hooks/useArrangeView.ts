import { useCallback } from "react"
import { ArrangeSelection } from "../entities/selection/ArrangeSelection"
import { useMobxSelector, useMobxStore } from "./useMobxSelector"
import { useSong } from "./useSong"
import { useStores } from "./useStores"
import { useTickScroll } from "./useTickScroll"

export function useArrangeView() {
  const { arrangeViewStore } = useStores()
  const { tickScrollStore } = arrangeViewStore
  const { setScrollLeftInPixels, scaleAroundPointX } =
    useTickScroll(tickScrollStore)

  return {
    get autoScroll() {
      return useMobxStore(({ arrangeViewStore }) => arrangeViewStore.autoScroll)
    },
    get canvasWidth() {
      return useMobxStore(
        ({ arrangeViewStore }) => arrangeViewStore.canvasWidth,
      )
    },
    get canvasHeight() {
      return useMobxStore(
        ({ arrangeViewStore }) => arrangeViewStore.canvasHeight,
      )
    },
    get cursorX() {
      return useMobxStore(({ arrangeViewStore }) => arrangeViewStore.cursorX)
    },
    get scaleX() {
      return useMobxStore(({ arrangeViewStore }) => arrangeViewStore.scaleX)
    },
    get scaleY() {
      return useMobxStore(({ arrangeViewStore }) => arrangeViewStore.scaleY)
    },
    get trackHeight() {
      return useMobxStore(
        ({ arrangeViewStore }) => arrangeViewStore.trackHeight,
      )
    },
    get contentWidth() {
      return useMobxStore(
        ({ arrangeViewStore }) => arrangeViewStore.contentWidth,
      )
    },
    get contentHeight() {
      return useMobxStore(
        ({ arrangeViewStore }) => arrangeViewStore.contentHeight,
      )
    },
    get notes() {
      return useMobxStore(({ arrangeViewStore }) => arrangeViewStore.notes)
    },
    get transform() {
      return useMobxStore(({ arrangeViewStore }) => arrangeViewStore.transform)
    },
    get scrollLeft() {
      return useMobxStore(
        ({ arrangeViewStore }) => arrangeViewStore.tickScrollStore.scrollLeft,
      )
    },
    get scrollTop() {
      return useMobxStore(({ arrangeViewStore }) => arrangeViewStore.scrollTop)
    },
    get selectedTrackIndex() {
      return useMobxStore(
        ({ arrangeViewStore }) => arrangeViewStore.selectedTrackIndex,
      )
    },
    get selectedTrackId() {
      return useMobxStore(
        ({ arrangeViewStore }) => arrangeViewStore.selectedTrackId,
      )
    },
    get selection() {
      return useMobxStore(({ arrangeViewStore }) => arrangeViewStore.selection)
    },
    get selectionRect() {
      return useMobxStore(
        ({ arrangeViewStore }) => arrangeViewStore.selectionRect,
      )
    },
    get selectedEventIds() {
      return useMobxStore(
        ({ arrangeViewStore }) => arrangeViewStore.selectedEventIds,
      )
    },
    get tracks() {
      const song = useSong()
      return useMobxSelector(() => song.tracks, [song])
    },
    get quantize() {
      return useMobxStore(({ arrangeViewStore }) => arrangeViewStore.quantize)
    },
    get quantizer() {
      return useMobxStore(({ arrangeViewStore }) => arrangeViewStore.quantizer)
    },
    get trackTransform() {
      return useMobxStore(
        ({ arrangeViewStore }) => arrangeViewStore.trackTransform,
      )
    },
    get openTransposeDialog() {
      return useMobxStore(
        ({ arrangeViewStore }) => arrangeViewStore.openTransposeDialog,
      )
    },
    get openVelocityDialog() {
      return useMobxStore(
        ({ arrangeViewStore }) => arrangeViewStore.openVelocityDialog,
      )
    },
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
    scaleAroundPointX,
    scrollBy: useCallback((x: number, y: number) => {
      setScrollLeftInPixels(tickScrollStore.scrollLeft - x)
      arrangeViewStore.setScrollTop(arrangeViewStore.scrollTop - y)
    }, []),
    setScrollLeftInPixels,
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
