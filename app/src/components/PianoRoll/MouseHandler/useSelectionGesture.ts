import { Point } from "../../../entities/geometry/Point"
import { Rect } from "../../../entities/geometry/Rect"
import { MouseGesture } from "../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { useCreateSelectionGesture } from "./gestures/useCreateSelectionGesture"
import { useDragSelectionLeftEdgeGesture } from "./gestures/useDragSelectionLeftEdgeGesture"
import { useDragSelectionRightEdgeGesture } from "./gestures/useDragSelectionRightEdgeGesture"
import { useMoveSelectionGesture } from "./gestures/useMoveSelectionGesture"
import { CursorProvider } from "./useNoteMouseGesture"

export const MIN_LENGTH = 10

export const useSelectionGesture = (): MouseGesture & CursorProvider => {
  const { getLocal, selectionBounds, selectedNoteIds } = usePianoRoll()
  const moveSelectionAction = useMoveSelectionGesture()
  const dragSelectionLeftEdgeAction = useDragSelectionLeftEdgeGesture()
  const dragSelectionRightEdgeAction = useDragSelectionRightEdgeGesture()
  const createSelectionAction = useCreateSelectionGesture()

  return {
    onMouseDown(e: MouseEvent) {
      if (e.relatedTarget) {
        return null
      }

      const local = getLocal(e)

      if (e.button === 0) {
        if (selectionBounds !== null) {
          const type = positionType(selectionBounds, local)
          switch (type) {
            case "center":
              return moveSelectionAction.onMouseDown(e)
            case "right":
              return dragSelectionRightEdgeAction.onMouseDown(
                e,
                selectedNoteIds,
              )
            case "left":
              return dragSelectionLeftEdgeAction.onMouseDown(e, selectedNoteIds)
            case "outside":
              return createSelectionAction.onMouseDown(e)
          }
        } else {
          return createSelectionAction.onMouseDown(e)
        }
      }

      return null
    },
    getCursor(e: MouseEvent) {
      const local = getLocal(e)
      const type =
        selectionBounds === null
          ? "outside"
          : positionType(selectionBounds, local)
      switch (type) {
        case "center":
          return "move"
        case "left":
          return "w-resize"
        case "right":
          return "e-resize"
        case "outside":
          return "crosshair"
      }
    },
  }
}

function positionType(selectionBounds: Rect, pos: Point) {
  const rect = selectionBounds
  const contains =
    rect.x <= pos.x &&
    rect.x + rect.width >= pos.x &&
    rect.y <= pos.y &&
    rect.y + rect.height >= pos.y
  if (!contains) {
    return "outside"
  }
  const localX = pos.x - rect.x
  const edgeSize = Math.min(rect.width / 3, 8)
  if (localX <= edgeSize) {
    return "left"
  }
  if (rect.width - localX <= edgeSize) {
    return "right"
  }
  return "center"
}
