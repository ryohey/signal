import { HitArea } from "@ryohey/webgl-react"
import { useCallback, useMemo } from "react"
import { Selection } from "../../../../components/GLNodes/Selection"
import { Rect } from "../../../../entities/geometry/Rect"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { useArrangeTransform } from "../../hooks/useArrangeTransform"
import { useArrangeView } from "../../hooks/useArrangeView"
import { useMoveSelectionGesture } from "../../hooks/useMoveSelectionGesture"

export const ArrangeViewSelection = ({ zIndex }: { zIndex: number }) => {
  const { selection } = useArrangeView()
  const { trackTransform } = useArrangeTransform()
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
      moveSelectionGesture(e, startClientPos, selectionRect)
    },
    [moveSelectionGesture, selectionRect],
  )

  if (selectionRect === null) {
    return <></>
  }

  return (
    <>
      <Selection rect={selectionRect} zIndex={zIndex} isActive={true} />
      <HitArea
        bounds={selectionRect}
        zIndex={zIndex}
        onMouseDown={onMouseDown}
      />
    </>
  )
}
