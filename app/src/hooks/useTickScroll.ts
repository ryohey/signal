import { clamp } from "lodash"
import { useCallback } from "react"
import { TickScrollStore } from "../stores/TickScrollStore"
import { useMobxSelector } from "./useMobxSelector"

export function useTickScroll(tickScrollStore: TickScrollStore) {
  const setScrollLeftInPixels = useCallback(
    (x: number) => {
      const { contentWidth } = tickScrollStore
      const { transform, canvasWidth } = tickScrollStore.parent
      const maxX = contentWidth - canvasWidth
      const scrollLeft = clamp(x, 0, maxX)
      tickScrollStore.parent.scrollLeftTicks = transform.getTick(scrollLeft)
    },
    [tickScrollStore],
  )

  const setScrollLeftInTicks = useCallback(
    (tick: number) => {
      setScrollLeftInPixels(tickScrollStore.parent.transform.getX(tick))
    },
    [tickScrollStore],
  )

  return {
    get scrollLeft() {
      return useMobxSelector(
        () => tickScrollStore.scrollLeft,
        [tickScrollStore],
      )
    },
    get scaleX() {
      return useMobxSelector(
        () => tickScrollStore.parent.scaleX,
        [tickScrollStore],
      )
    },
    get contentWidth() {
      return useMobxSelector(
        () => tickScrollStore.contentWidth,
        [tickScrollStore],
      )
    },
    setScrollLeftInPixels,
    // Unlike scrollLeft = tick, this method keeps the scroll position within the content area
    setScrollLeftInTicks,
    scaleAroundPointX: (scaleXDelta: number, pixelX: number) => {
      const { maxScaleX, minScaleX } = tickScrollStore
      const pixelXInTicks0 = tickScrollStore.parent.transform.getTick(
        tickScrollStore.scrollLeft + pixelX,
      )
      tickScrollStore.parent.scaleX = clamp(
        tickScrollStore.parent.scaleX * (1 + scaleXDelta),
        minScaleX,
        maxScaleX,
      )
      const pixelXInTicks1 = tickScrollStore.parent.transform.getTick(
        tickScrollStore.scrollLeft + pixelX,
      )
      const scrollInTicks = pixelXInTicks1 - pixelXInTicks0
      setScrollLeftInTicks(
        tickScrollStore.parent.scrollLeftTicks - scrollInTicks,
      )
    },
  }
}
