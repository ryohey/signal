import { HitArea } from "@ryohey/webgl-react"
import { type FC, useMemo } from "react"
import type { Rect } from "../../../entities/geometry/Rect"
import { Selection as SelectionEntity } from "../../../entities/selection/Selection"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { Selection } from "../../GLNodes/Selection"
import { useDragSelectionLeftEdgeGesture } from "../MouseHandler/gestures/useDragSelectionLeftEdgeGesture"
import { useDragSelectionRightEdgeGesture } from "../MouseHandler/gestures/useDragSelectionRightEdgeGesture"
import { useMoveSelectionGesture } from "../MouseHandler/gestures/useMoveSelectionGesture"

export const NoteSelection: FC<{ zIndex: number }> = ({ zIndex }) => {
  const { selection, transform } = usePianoRoll()
  const selectionBounds = useMemo(() => {
    if (selection === null) {
      return null
    }
    return SelectionEntity.getBounds(selection, transform)
  }, [selection, transform])

  if (selectionBounds === null) {
    return null
  }

  return <NoteSelectionContent rect={selectionBounds} zIndex={zIndex} />
}

const NoteSelectionContent: FC<{ rect: Rect; zIndex: number }> = ({
  rect,
  zIndex,
}) => {
  const { selectedNoteIds } = usePianoRoll()
  const moveSelectionAction = useMoveSelectionGesture()
  const dragSelectionLeftEdgeAction = useDragSelectionLeftEdgeGesture()
  const dragSelectionRightEdgeAction = useDragSelectionRightEdgeGesture()

  const edgeSize = Math.min(rect.width / 3, 8)
  const leftEdgeBounds: Rect = useMemo(
    () => ({
      x: rect.x,
      y: rect.y,
      width: edgeSize,
      height: rect.height,
    }),
    [rect.x, rect.y, rect.height, edgeSize]
  )
  const centerBounds: Rect = useMemo(
    () => ({
      x: rect.x + edgeSize,
      y: rect.y,
      width: rect.width - edgeSize * 2,
      height: rect.height,
    }),
    [rect.x, rect.y, rect.width, rect.height, edgeSize]
  )
  const rightEdgeBounds: Rect = useMemo(
    () => ({
      x: rect.x + rect.width - edgeSize,
      y: rect.y,
      width: edgeSize,
      height: rect.height,
    }),
    [rect.x, rect.y, rect.width, rect.height, edgeSize]
  )
  const onMouseDownLeft = (e: MouseEvent) => {
    e.stopPropagation()
    dragSelectionLeftEdgeAction.onMouseDown(e, selectedNoteIds)
  }
  const onMouseDownCenter = (e: MouseEvent) => {
    e.stopPropagation()
    moveSelectionAction.onMouseDown(e)
  }
  const onMouseDownRight = (e: MouseEvent) => {
    e.stopPropagation()
    dragSelectionRightEdgeAction.onMouseDown(e, selectedNoteIds)
  }

  return (
    <>
      <Selection rect={rect} zIndex={zIndex} />
      {/* left edge */}
      <HitArea
        bounds={leftEdgeBounds}
        zIndex={zIndex}
        cursor="w-resize"
        onMouseDown={onMouseDownLeft}
      />
      {/* center */}
      <HitArea
        bounds={centerBounds}
        zIndex={zIndex}
        cursor="move"
        onMouseDown={onMouseDownCenter}
      />
      {/* right edge */}
      <HitArea
        bounds={rightEdgeBounds}
        zIndex={zIndex}
        cursor="e-resize"
        onMouseDown={onMouseDownRight}
      />
    </>
  )
}
