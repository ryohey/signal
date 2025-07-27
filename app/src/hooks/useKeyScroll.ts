import { clamp } from "lodash"
import { createContext, useCallback, useContext } from "react"
import { KeyScrollStore } from "../stores/KeyScrollStore"
import { useMobxGetter } from "./useMobxSelector"

const SCALE_Y_MIN = 0.5
const SCALE_Y_MAX = 4

const KeyScrollContext = createContext<KeyScrollStore>(null!)
export const KeyScrollProvider = KeyScrollContext.Provider

export function useKeyScroll(
  keyScrollStore: KeyScrollStore = useContext(KeyScrollContext),
) {
  const setScrollTopInPixels = useCallback(
    (y: number) => {
      const { transform, canvasHeight } = keyScrollStore
      const maxY = transform.getMaxY() - canvasHeight
      const scrollTop = clamp(y, 0, maxY)
      keyScrollStore.scrollTopKeys =
        transform.getNoteNumberFractional(scrollTop)
    },
    [keyScrollStore],
  )

  const setScrollTopInKeys = useCallback(
    (keys: number) => {
      const { transform } = keyScrollStore
      setScrollTopInPixels(transform.getY(keys))
    },
    [keyScrollStore, setScrollTopInPixels],
  )

  return {
    get contentHeight(): number {
      return useMobxGetter(keyScrollStore, "transform").getMaxY()
    },
    get scrollTop() {
      return useMobxGetter(keyScrollStore, "scrollTop")
    },
    get scrollTopKeys() {
      return useMobxGetter(keyScrollStore, "scrollTopKeys")
    },
    get scaleY() {
      return useMobxGetter(keyScrollStore, "scaleY")
    },
    get canvasHeight() {
      return useMobxGetter(keyScrollStore, "canvasHeight")
    },
    get transform() {
      return useMobxGetter(keyScrollStore, "transform")
    },
    setScrollTopInPixels,
    setScrollTopInKeys,
    setCanvasHeight: useCallback(
      (height: number) => (keyScrollStore.canvasHeight = height),
      [keyScrollStore],
    ),
    setScaleY: useCallback(
      (scale: number) => (keyScrollStore.scaleY = scale),
      [keyScrollStore],
    ),
    scaleAroundPointY: useCallback(
      (scaleYDelta: number, pixelY: number) => {
        const { transform, scrollTop, scaleY, scrollTopKeys } = keyScrollStore
        const pixelYInKeys0 = transform.getNoteNumberFractional(
          scrollTop + pixelY,
        )
        keyScrollStore.scaleY = clamp(
          scaleY * (1 + scaleYDelta),
          SCALE_Y_MIN,
          SCALE_Y_MAX,
        )
        const updatedTransform = keyScrollStore.transform
        const updatedScrollTop = keyScrollStore.scrollTop
        const pixelYInKeys1 = updatedTransform.getNoteNumberFractional(
          updatedScrollTop + pixelY,
        )
        const scrollInKeys = pixelYInKeys1 - pixelYInKeys0
        setScrollTopInKeys(scrollTopKeys - scrollInKeys)
      },
      [keyScrollStore, setScrollTopInKeys],
    ),
  }
}
