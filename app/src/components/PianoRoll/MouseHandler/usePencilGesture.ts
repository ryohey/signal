import { Point } from "../../../entities/geometry/Point"
import { MouseGesture } from "../../../gesture/MouseGesture"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { useTrack } from "../../../hooks/useTrack"
import { PianoNoteItem } from "../../../stores/PianoRollStore"
import { useCreateNoteGesture } from "./gestures/useCreateNoteGesture"
import { useSelectNoteGesture } from "./gestures/useSelectNoteGesture"
import { CursorProvider } from "./useNoteMouseGesture"

export const usePencilGesture = (): MouseGesture & CursorProvider => {
  const { getLocal, getNotes, selectedTrackId } = usePianoRoll()
  const { isRhythmTrack } = useTrack(selectedTrackId)
  const createNoteGesture = useCreateNoteGesture()
  const selectNoteGesture = useSelectNoteGesture()

  return {
    onMouseDown(e: MouseEvent) {
      const local = getLocal(e)
      const items = getNotes(local)

      switch (e.button) {
        case 0: {
          if (items.length > 0) {
            // no-op
          } else {
            if (e.shiftKey || e.metaKey) {
              return selectNoteGesture.onMouseDown(e)
            } else {
              return createNoteGesture.onMouseDown(e)
            }
          }
          break
        }
        default:
          return null
      }
    },
    getCursor(e: MouseEvent): string {
      const local = getLocal(e)
      const items = getNotes(local)
      if (items.length > 0) {
        const position = getPositionType(local, items[0], isRhythmTrack)
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
