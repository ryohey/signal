import { clamp } from "lodash"
import { createContext, useCallback, useContext } from "react"
import { TickScrollStore } from "../stores/TickScrollStore"
import { useMobxGetter, useMobxSetter } from "./useMobxSelector"

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
      return useMobxGetter(tickScrollStore, "autoScroll")
    },
    get cursorX() {
      return useMobxGetter(tickScrollStore, "cursorX")
    },
    get scrollLeft() {
      return useMobxGetter(tickScrollStore, "scrollLeft")
    },
    get scrollLeftTicks() {
      return useMobxGetter(tickScrollStore, "scrollLeftTicks")
    },
    get scaleX() {
      return useMobxGetter(tickScrollStore, "scaleX")
    },
    get transform() {
      return useMobxGetter(tickScrollStore, "transform")
    },
    get canvasWidth() {
      return useMobxGetter(tickScrollStore, "canvasWidth")
    },
    get contentWidth() {
      return useMobxGetter(tickScrollStore, "contentWidth")
    },
    getTick: useCallback(
      (offsetX: number) =>
        tickScrollStore.transform.getTick(offsetX + tickScrollStore.scrollLeft),
      [tickScrollStore],
    ),
    setCanvasWidth: useMobxSetter(tickScrollStore, "canvasWidth"),
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
    setAutoScroll: useMobxSetter(tickScrollStore, "autoScroll"),
  }
}
