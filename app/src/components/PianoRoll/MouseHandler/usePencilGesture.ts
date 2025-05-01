import { Point } from "../../../entities/geometry/Point"
import { MouseGesture } from "../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { PianoNoteItem } from "../../../stores/PianoRollStore"
import { useAddNoteToSelectionGesture } from "./gestures/useAddNoteToSelectionGesture"
import { useCreateNoteGesture } from "./gestures/useCreateNoteGesture"
import {
  useDragNoteCenterGesture,
  useDragNoteLeftGesture,
  useDragNoteRightGesture,
} from "./gestures/useDragNoteEdgeGesture"
import { useRemoveNoteFromSelectionGesture } from "./gestures/useRemoveNoteFromSelectionGesture"
import { useRemoveNoteGesture } from "./gestures/useRemoveNoteGesture"
import { useSelectNoteGesture } from "./gestures/useSelectNoteGesture"
import { CursorProvider } from "./useNoteMouseGesture"

export const usePencilGesture = (): MouseGesture & CursorProvider => {
  const { getLocal, getNotes, selectedTrack } = usePianoRoll()
  const removeNoteGesture = useRemoveNoteGesture()
  const createNoteGesture = useCreateNoteGesture()
  const selectNoteGesture = useSelectNoteGesture()
  const dragNoteCenterGesture = useDragNoteCenterGesture()
  const dragNoteLeftGesture = useDragNoteLeftGesture()
  const dragNoteRightGesture = useDragNoteRightGesture()
  const removeNoteFromSelectionGesture = useRemoveNoteFromSelectionGesture()
  const addNoteToSelectionGesture = useAddNoteToSelectionGesture()

  return {
    onMouseDown(e: MouseEvent) {
      const local = getLocal(e)
      const items = getNotes(local)
      const isDrum = selectedTrack?.isRhythmTrack ?? false

      switch (e.button) {
        case 0: {
          if (items.length > 0) {
            if (e.detail % 2 === 0) {
              return removeNoteGesture.onMouseDown(e)
            }

            const item = items[0]

            if (e.shiftKey) {
              if (item.isSelected) {
                removeNoteFromSelectionGesture.onMouseDown(e, item.id)
              } else {
                addNoteToSelectionGesture.onMouseDown(e, item.id)
              }
            } else {
              const position = getPositionType(local, item, isDrum)
              switch (position) {
                case "center":
                  return dragNoteCenterGesture.onMouseDown(e, item.id)
                case "left":
                  return dragNoteLeftGesture.onMouseDown(e, item.id)
                case "right":
                  return dragNoteRightGesture.onMouseDown(e, item.id)
              }
            }
          } else {
            if (e.shiftKey || e.metaKey) {
              return selectNoteGesture.onMouseDown(e)
            } else {
              return createNoteGesture.onMouseDown(e)
            }
          }
          break
        }
        case 2:
          return removeNoteGesture.onMouseDown(e)
        default:
          return null
      }
    },
    getCursor(e: MouseEvent): string {
      const local = getLocal(e)
      const items = getNotes(local)
      const isDrum = selectedTrack?.isRhythmTrack ?? false
      if (items.length > 0) {
        const position = getPositionType(local, items[0], isDrum)
        return mousePositionToCursor(position)
      }

      return "auto"
    },
  }
}

type MousePositionType = "left" | "center" | "right"

const mousePositionToCursor = (position: MousePositionType) => {
  switch (position) {
    case "center":
      return "move"
    case "left":
      return "w-resize"
    case "right":
      return "e-resize"
  }
}

const getPositionType = (
  local: Point,
  item: PianoNoteItem,
  isDrum: boolean,
): MousePositionType => {
  if (item === null) {
    console.warn("no item")
    return "center"
  }
  const localX = local.x - item.x

  if (isDrum) {
    return "center"
  }
  const edgeSize = Math.min(item.width / 3, 8)
  if (localX <= edgeSize) {
    return "left"
  }
  if (item.width - localX <= edgeSize) {
    return "right"
  }
  return "center"
}
