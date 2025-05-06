import { useCallback } from "react"
import { ArrangeSelection } from "../entities/selection/ArrangeSelection"
import { useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"
import { useTickScroll } from "./useTickScroll"
import { useTrackScroll } from "./useTrackScroll"

export function useArrangeView() {
  const { arrangeViewStore } = useStores()
  const { tickScrollStore, trackScrollStore } = arrangeViewStore
  const { setScrollLeftInPixels } = useTickScroll(tickScrollStore)
  const { setScrollTop } = useTrackScroll(trackScrollStore)

  return {
    get notes() {
      return useMobxStore(({ arrangeViewStore }) => arrangeViewStore.notes)
    },
    get transform() {
      return useMobxStore(({ arrangeViewStore }) => arrangeViewStore.transform)
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
    scrollBy: useCallback(
      (x: number, y: number) => {
        setScrollLeftInPixels(tickScrollStore.scrollLeft - x)
        setScrollTop(trackScrollStore.scrollTop - y)
      },
      [setScrollLeftInPixels, setScrollTop, tickScrollStore, trackScrollStore],
    ),
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
