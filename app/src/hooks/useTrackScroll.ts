import { createContext, useCallback, useContext } from "react"
import { TrackScrollStore } from "../stores/TrackScrollStore"
import { useMobxSelector } from "./useMobxSelector"

const TrackScrollContext = createContext<TrackScrollStore>(null!)
export const TrackScrollProvider = TrackScrollContext.Provider

// Vertical scroll for ArrangeView
export function useTrackScroll(
  trackScrollStore: TrackScrollStore = useContext(TrackScrollContext),
) {
  return {
    get canvasHeight() {
      return useMobxSelector(
        () => trackScrollStore.canvasHeight,
        [trackScrollStore],
      )
    },
    get contentHeight() {
      return useMobxSelector(
        () => trackScrollStore.contentHeight,
        [trackScrollStore],
      )
    },
    get scaleY() {
      return useMobxSelector(() => trackScrollStore.scaleY, [trackScrollStore])
    },
    get scrollTop() {
      return useMobxSelector(
        () => trackScrollStore.scrollTop,
        [trackScrollStore],
      )
    },
    get trackHeight() {
      return useMobxSelector(
        () => trackScrollStore.trackHeight,
        [trackScrollStore],
      )
    },
    setCanvasHeight: useCallback(
      (height: number) => {
        trackScrollStore.canvasHeight = height
      },
      [trackScrollStore],
    ),
    setScaleY: useCallback(
      (scaleY: number) => {
        trackScrollStore.setScaleY(scaleY)
      },
      [trackScrollStore],
    ),
    setScrollTop: useCallback((value: number) => {
      trackScrollStore.setScrollTop(value)
    }, []),
  }
}
