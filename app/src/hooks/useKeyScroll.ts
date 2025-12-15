import { atom, SetStateAction, useAtomValue, useSetAtom } from "jotai"
import { clamp } from "lodash"
import { Layout } from "../Constants"
import { KeyTransform } from "../entities/transform/KeyTransform"

const SCALE_Y_MIN = 0.5
const SCALE_Y_MAX = 4

export function useKeyScroll() {
  return {
    get contentHeight(): number {
      return useAtomValue(contentHeightAtom)
    },
    get scrollTop() {
      return useAtomValue(scrollTopInPixelsAtom)
    },
    get scrollTopKeys() {
      return useAtomValue(scrollTopKeysAtom)
    },
    get scaleY() {
      return useAtomValue(scaleYAtom)
    },
    get canvasHeight() {
      return useAtomValue(canvasHeightAtom)
    },
    get transform() {
      return useAtomValue(transformAtom)
    },
    setScrollTopInPixels: useSetAtom(scrollTopInPixelsAtom),
    setScrollTopInKeys: useSetAtom(scrollTopKeysAtom),
    setCanvasHeight: useSetAtom(canvasHeightAtom),
    setScaleY: useSetAtom(scaleYAtom),
    scaleAroundPointY: useSetAtom(scaleAroundPointYAtom),
  }
}

// atoms
const canvasHeightAtom = atom(0)
const scaleYAtom = atom(1)
const scrollTopKeysAtom = atom(70) // Default to middle of the piano roll

// derived atoms
const transformAtom = atom(
  (get) => new KeyTransform(Layout.keyHeight * get(scaleYAtom), 127),
)
const scrollTopInPixelsAtom = atom(
  (get) => Math.round(get(transformAtom).getY(get(scrollTopKeysAtom))),
  (get, set, value: SetStateAction<number>) => {
    const y =
      typeof value === "function" ? value(get(scrollTopInPixelsAtom)) : value
    const transform = get(transformAtom)
    const canvasHeight = get(canvasHeightAtom)
    const maxY = transform.getMaxY() - canvasHeight
    const scrollTop = clamp(y, 0, maxY)
    set(scrollTopKeysAtom, transform.getNoteNumberFractional(scrollTop))
  },
)
const contentHeightAtom = atom((get) => get(transformAtom).getMaxY())

// actions
const scaleAroundPointYAtom = atom(
  null,
  (get, set, scaleYDelta: number, pixelY: number) => {
    const transform = get(transformAtom)
    const scrollTop = get(scrollTopInPixelsAtom)
    const pixelYInKeys0 = transform.getNoteNumberFractional(scrollTop + pixelY)
    set(scaleYAtom, (prev) =>
      clamp(prev * (1 + scaleYDelta), SCALE_Y_MIN, SCALE_Y_MAX),
    )
    const updatedTransform = get(transformAtom)
    const updatedScrollTop = get(scrollTopInPixelsAtom)
    const pixelYInKeys1 = updatedTransform.getNoteNumberFractional(
      updatedScrollTop + pixelY,
    )
    const scrollInKeys = pixelYInKeys1 - pixelYInKeys0
    set(scrollTopKeysAtom, (prev) => prev - scrollInKeys)
  },
)
