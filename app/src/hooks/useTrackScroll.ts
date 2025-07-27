import { createContext, useCallback, useContext } from "react"
import { TrackScrollStore } from "../stores/TrackScrollStore"
import { useMobxGetter, useMobxSetter } from "./useMobxSelector"

const TrackScrollContext = createContext<TrackScrollStore>(null!)
export const TrackScrollProvider = TrackScrollContext.Provider

// Vertical scroll for ArrangeView
export function useTrackScroll(
  trackScrollStore: TrackScrollStore = useContext(TrackScrollContext),
) {
  return {
    get canvasHeight() {
      return useMobxGetter(trackScrollStore, "canvasHeight")
    },
    get contentHeight() {
      return useMobxGetter(trackScrollStore, "contentHeight")
    },
    get scaleY() {
      return useMobxGetter(trackScrollStore, "scaleY")
    },
    get scrollTop() {
      return useMobxGetter(trackScrollStore, "scrollTop")
    },
    get trackHeight() {
      return useMobxGetter(trackScrollStore, "trackHeight")
    },
    setCanvasHeight: useMobxSetter(trackScrollStore, "canvasHeight"),
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
