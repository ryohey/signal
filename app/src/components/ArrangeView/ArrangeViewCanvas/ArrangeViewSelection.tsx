import { HitArea } from "@ryohey/webgl-react"
import { useCallback, useMemo } from "react"
import type { Rect } from "../../../entities/geometry/Rect"
import { getClientPos } from "../../../helpers/mouseEvent"
import { useArrangeView } from "../../../hooks/useArrangeView"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { Selection } from "../../GLNodes/Selection"
import { useMoveSelectionGesture } from "./gestures/useMoveSelectionGesture"

export const ArrangeViewSelection = ({ zIndex }: { zIndex: number }) => {
  const { selection, trackTransform } = useArrangeView()
  const { transform: tickTransform } = useTickScroll()
  const moveSelectionGesture = useMoveSelectionGesture()

  const selectionRect: Rect | null = useMemo(() => {
    if (selection === null) {
      return null
    }
    const x = tickTransform.getX(selection.fromTick)
    const right = tickTransform.getX(selection.toTick)
    const y = trackTransform.getY(selection.fromTrackIndex)
    const bottom = trackTransform.getY(selection.toTrackIndex)
    return {
      x,
      width: right - x,
      y,
      height: bottom - y,
    }
  }, [selection, trackTransform, tickTransform])

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      if (selectionRect === null || e.button !== 0) {
        return
      }
      e.stopPropagation()
      const startClientPos = getClientPos(e)
      moveSelectionGesture.onMouseDown(e, startClientPos, selectionRect)
    },
    [moveSelectionGesture, selectionRect]
  )

  if (selectionRect === null) {
    return null
  }

  return (
    <>
      <Selection rect={selectionRect} zIndex={zIndex} />
      <HitArea
        bounds={selectionRect}
        zIndex={zIndex}
        onMouseDown={onMouseDown}
      />
    </>
  )
}
