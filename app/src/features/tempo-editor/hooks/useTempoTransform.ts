import { Point } from "@signal-app/geometry"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback, useMemo } from "react"
import { TempoCoordTransform } from "../entities/TempoCoordTransform"
import { useTempoTickScroll } from "./useTempoEditor"

export function useTempoTransform() {
  return {
    get transform() {
      // WANTFIX: Use derived atom to create TempoCoordTransform
      const { transform: tickTransform } = useTempoTickScroll()
      const canvasHeight = useAtomValue(canvasHeightAtom)
      return useMemo(
        () => new TempoCoordTransform(tickTransform, canvasHeight),
        [tickTransform, canvasHeight],
      )
    },
    // convert mouse position to the local coordinate on the canvas
    get getLocal() {
      const { scrollLeft } = useTempoTickScroll()
      return useCallback(
        (e: { offsetX: number; offsetY: number }): Point => ({
          x: e.offsetX + scrollLeft,
          y: e.offsetY,
        }),
        [scrollLeft],
      )
    },
    setCanvasHeight: useSetAtom(canvasHeightAtom),
  }
}

// atoms
const canvasHeightAtom = atom(0)
