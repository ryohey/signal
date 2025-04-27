import { Point } from "../../../../entities/geometry/Point"
import { Range } from "../../../../entities/geometry/Range"
import { NotePoint } from "../../../../entities/transform/NotePoint"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { useHistory } from "../../../../hooks/useHistory"
import { useStores } from "../../../../hooks/useStores"
import {
  DraggableArea,
  PianoRollDraggable,
} from "../../../../stores/PianoRollStore"
import { MIN_LENGTH } from "../useSelectionGesture"

export interface MoveDraggableCallback {
  onChange?: (
    e: MouseEvent,
    changes: { oldPosition: NotePoint; newPosition: NotePoint },
  ) => void
  onMouseUp?: (e: MouseEvent) => void
  onClick?: (e: MouseEvent) => void
}

const constraintToDraggableArea = (
  point: NotePoint,
  draggableArea: DraggableArea,
) => {
  return {
    tick:
      draggableArea.tickRange !== undefined
        ? Range.clamp(draggableArea.tickRange, point.tick)
        : point.tick,
    noteNumber:
      draggableArea.noteNumberRange !== undefined
        ? Range.clamp(draggableArea.noteNumberRange, point.noteNumber)
        : point.noteNumber,
  }
}

export const useMoveDraggableGesture = (): MouseGesture<
  [PianoRollDraggable, PianoRollDraggable[]?, MoveDraggableCallback?]
> => {
  const {
    pianoRollStore,
    pianoRollStore: { isQuantizeEnabled, transform, quantizer },
  } = useStores()
  const { pushHistory } = useHistory()

  return {
    onMouseDown(e, draggable, subDraggables = [], callback = {}) {
      const draggablePosition = pianoRollStore.getDraggablePosition(draggable)

      if (draggablePosition === null) {
        return
      }

      let isChanged = false

      const startPos = pianoRollStore.getLocal(e)
      const notePoint = transform.getNotePoint(startPos)
      const offset = NotePoint.sub(draggablePosition, notePoint)

      const subDraggablePositions = subDraggables.map((subDraggable) =>
        pianoRollStore.getDraggablePosition(subDraggable),
      )

      observeDrag2(e, {
        onMouseMove: (e2, d) => {
          const quantize = !e2.shiftKey && isQuantizeEnabled
          const minLength = quantize ? quantizer.unit : MIN_LENGTH

          const draggableArea = pianoRollStore.getDraggableArea(
            draggable,
            minLength,
          )

          if (draggableArea === null) {
            return
          }

          const currentPosition = pianoRollStore.getDraggablePosition(draggable)

          if (currentPosition === null) {
            return
          }

          const newPosition = (() => {
            const local = Point.add(startPos, d)
            const notePoint = NotePoint.add(
              transform.getNotePoint(local),
              offset,
            )
            const position = quantize
              ? {
                  tick: quantizer.round(notePoint.tick),
                  noteNumber: notePoint.noteNumber,
                }
              : notePoint
            return constraintToDraggableArea(position, draggableArea)
          })()

          if (NotePoint.equals(newPosition, currentPosition)) {
            return
          }

          const delta = NotePoint.sub(newPosition, draggablePosition)

          const newSubDraggablePositions = subDraggables.map(
            (subDraggable, i) => {
              const subDraggablePosition = subDraggablePositions[i]

              if (subDraggablePosition === null) {
                return null
              }

              const subDraggableArea = pianoRollStore.getDraggableArea(
                subDraggable,
                minLength,
              )

              if (subDraggableArea === null) {
                return null
              }

              const position = NotePoint.add(subDraggablePosition, delta)
              return constraintToDraggableArea(position, subDraggableArea)
            },
          )

          if (!isChanged) {
            isChanged = true
            pushHistory()
          }

          pianoRollStore.updateDraggable(draggable, newPosition)

          subDraggables.forEach((subDraggable, i) => {
            const subDraggablePosition = newSubDraggablePositions[i]

            if (
              subDraggablePosition === null ||
              subDraggablePosition === null
            ) {
              return
            }

            pianoRollStore.updateDraggable(subDraggable, subDraggablePosition)
          })

          callback?.onChange?.(e2, {
            oldPosition: currentPosition,
            newPosition,
          })
        },
        onMouseUp: (e2) => {
          callback?.onMouseUp?.(e2)
        },
        onClick: (e2) => {
          callback?.onClick?.(e2)
        },
      })
    },
  }
}
