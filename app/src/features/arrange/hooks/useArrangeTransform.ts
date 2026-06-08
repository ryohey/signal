import { useCallback, useMemo } from "react"
import { ArrangeCoordTransform } from "../../../entities/transform/ArrangeCoordTransform"
import { useArrangeTickScroll, useArrangeTrackScroll } from "./useArrangeView"

export function useArrangeTransform() {
  return {
    get trackTransform() {
      const { transform: tickTransform } = useArrangeTickScroll()
      const { transform: trackTransform } = useArrangeTrackScroll()
      return useMemo(
        () => new ArrangeCoordTransform(tickTransform, trackTransform),
        [tickTransform, trackTransform],
      )
    },
    get scrollBy() {
      const { setScrollLeftInPixels } = useArrangeTickScroll()
      const { setScrollTop } = useArrangeTrackScroll()
      return useCallback(
        (x: number, y: number) => {
          setScrollLeftInPixels((prev) => prev - x)
          setScrollTop((prev) => prev - y)
        },
        [setScrollLeftInPixels, setScrollTop],
      )
    },
  }
}
