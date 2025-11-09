import { HitArea } from "@ryohey/webgl-react"
import { useCallback } from "react"
import { getClientPos } from "../../../helpers/mouseEvent"
import { useArrangeView } from "../../../hooks/useArrangeView"
import { Selection } from "../../GLNodes/Selection"
import { useMoveSelectionGesture } from "./gestures/useMoveSelectionGesture"

export const ArrangeViewSelection = ({ zIndex }: { zIndex: number }) => {
  const { selectionRect } = useArrangeView()
  const moveSelectionGesture = useMoveSelectionGesture()

  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      if (selectionRect === null) {
        return
      }
      e.stopPropagation()
      const startClientPos = getClientPos(e)
      moveSelectionGesture.onMouseDown(e, startClientPos, selectionRect)
    },
    [moveSelectionGesture, selectionRect],
  )

  if (selectionRect === null) {
    return <></>
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
