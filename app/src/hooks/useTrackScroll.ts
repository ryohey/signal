import { createContext, useContext } from "react"
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
    get transform() {
      return useMobxGetter(trackScrollStore, "transform")
    },
    setCanvasHeight: useMobxSetter(trackScrollStore, "canvasHeight"),
    setScaleY: trackScrollStore.setScaleY,
    setScrollTop: trackScrollStore.setScrollTop,
  }
}
