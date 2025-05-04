import { clamp } from "lodash"
import { createContext, useCallback, useContext } from "react"
import { TickScrollStore } from "../stores/TickScrollStore"
import { useMobxSelector } from "./useMobxSelector"

const TickScrollContext = createContext<TickScrollStore>(null!)
export const TickScrollProvider = TickScrollContext.Provider

export function useTickScroll(
  tickScrollStore: TickScrollStore = useContext(TickScrollContext),
) {
  const setScrollLeftInPixels = useCallback(
    (x: number) => {
      const { transform, canvasWidth, contentWidth } = tickScrollStore
      const maxX = contentWidth - canvasWidth
      const scrollLeft = clamp(x, 0, maxX)
      tickScrollStore.scrollLeftTicks = transform.getTick(scrollLeft)
    },
    [tickScrollStore],
  )

  const setScrollLeftInTicks = useCallback(
    (tick: number) => {
      setScrollLeftInPixels(tickScrollStore.transform.getX(tick))
    },
    [tickScrollStore],
  )

  return {
    get autoScroll() {
      return useMobxSelector(
        () => tickScrollStore.autoScroll,
        [tickScrollStore],
      )
    },
    get scrollLeft() {
      return useMobxSelector(
        () => tickScrollStore.scrollLeft,
        [tickScrollStore],
      )
    },
    get scrollLeftTicks() {
      return useMobxSelector(
        () => tickScrollStore.scrollLeftTicks,
        [tickScrollStore],
      )
    },
    get scaleX() {
      return useMobxSelector(() => tickScrollStore.scaleX, [tickScrollStore])
    },
    get transform() {
      return useMobxSelector(() => tickScrollStore.transform, [tickScrollStore])
    },
    get canvasWidth() {
      return useMobxSelector(
        () => tickScrollStore.canvasWidth,
        [tickScrollStore],
      )
    },
    get contentWidth() {
      return useMobxSelector(
        () => tickScrollStore.contentWidth,
        [tickScrollStore],
      )
    },
    getTick: useCallback(
      (offsetX: number) =>
        tickScrollStore.transform.getTick(offsetX + tickScrollStore.scrollLeft),
      [tickScrollStore],
    ),
    setCanvasWidth: useCallback(
      (width: number) => {
        tickScrollStore.canvasWidth = width
      },
      [tickScrollStore],
    ),
    setScrollLeftInPixels,
    // Unlike scrollLeft = tick, this method keeps the scroll position within the content area
    setScrollLeftInTicks,
    setScaleX: useCallback(
      (scaleX: number) => {
        tickScrollStore.scaleX = clamp(
          scaleX,
          tickScrollStore.minScaleX,
          tickScrollStore.maxScaleX,
        )
      },
      [tickScrollStore],
    ),
    scaleAroundPointX: (scaleXDelta: number, pixelX: number) => {
      const { maxScaleX, minScaleX } = tickScrollStore
      const pixelXInTicks0 = tickScrollStore.transform.getTick(
        tickScrollStore.scrollLeft + pixelX,
      )
      tickScrollStore.scaleX = clamp(
        tickScrollStore.scaleX * (1 + scaleXDelta),
        minScaleX,
        maxScaleX,
      )
      const pixelXInTicks1 = tickScrollStore.transform.getTick(
        tickScrollStore.scrollLeft + pixelX,
      )
      const scrollInTicks = pixelXInTicks1 - pixelXInTicks0
      setScrollLeftInTicks(tickScrollStore.scrollLeftTicks - scrollInTicks)
    },
    setAutoScroll: useCallback(
      (autoScroll: boolean) => {
        tickScrollStore.autoScroll = autoScroll
      },
      [tickScrollStore],
    ),
  }
}
