import { clamp } from "lodash"
import { createContext, useCallback, useContext } from "react"
import { KeyScrollStore } from "../stores/KeyScrollStore"
import { useMobxSelector } from "./useMobxSelector"

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
      return useMobxSelector(
        () => keyScrollStore.transform,
        [keyScrollStore],
      ).getMaxY()
    },
    get scrollTop() {
      return useMobxSelector(() => keyScrollStore.scrollTop, [keyScrollStore])
    },
    get scrollTopKeys() {
      return useMobxSelector(
        () => keyScrollStore.scrollTopKeys,
        [keyScrollStore],
      )
    },
    get scaleY() {
      return useMobxSelector(() => keyScrollStore.scaleY, [keyScrollStore])
    },
    get canvasHeight() {
      return useMobxSelector(
        () => keyScrollStore.canvasHeight,
        [keyScrollStore],
      )
    },
    get transform() {
      return useMobxSelector(() => keyScrollStore.transform, [keyScrollStore])
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
