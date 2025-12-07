import { Range } from "@signal-app/core"
import { transaction } from "mobx"
import { Point } from "../../../../entities/geometry/Point"
import { NotePoint } from "../../../../entities/transform/NotePoint"
import type { MouseGesture } from "../../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { useHistory } from "../../../../hooks/useHistory"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import {
  type DraggableArea,
  type PianoRollDraggable,
  usePianoRollDraggable,
} from "../../../../hooks/usePianoRollDraggable"
import { useQuantizer } from "../../../../hooks/useQuantizer"

const MIN_LENGTH = 10

export interface MoveDraggableCallback {
  onChange?: (
    e: MouseEvent,
    changes: { oldPosition: NotePoint; newPosition: NotePoint }
  ) => void
  onMouseUp?: (e: MouseEvent) => void
  onClick?: (e: MouseEvent) => void
}

const constraintToDraggableArea = (
  point: NotePoint,
  draggableArea: DraggableArea
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
  const { transform, getLocal } = usePianoRoll()
  const {
    isQuantizeEnabled,
    quantize: quantizeUnit,
    quantizeRound,
  } = useQuantizer()
  const { getDraggablePosition, getDraggableArea, updateDraggable } =
    usePianoRollDraggable()

  const { pushHistory } = useHistory()

  return {
    onMouseDown(e, draggable, subDraggables = [], callback = {}) {
      const draggablePosition = getDraggablePosition(draggable)

      if (draggablePosition === null) {
        return
      }

      let isChanged = false

      const startPos = getLocal(e)
      const notePoint = transform.getNotePoint(startPos)
      const offset = NotePoint.sub(draggablePosition, notePoint)

      const subDraggablePositions = subDraggables.map((subDraggable) =>
        getDraggablePosition(subDraggable)
      )

      observeDrag2(e, {
        onMouseMove: (e2, d) => {
          const quantize = !e2.shiftKey && isQuantizeEnabled
          const minLength = quantize ? quantizeUnit : MIN_LENGTH

          const draggableArea = getDraggableArea(draggable, minLength)

          if (draggableArea === null) {
            return
          }

          const currentPosition = getDraggablePosition(draggable)

          if (currentPosition === null) {
            return
          }

          const newPosition = (() => {
            const local = Point.add(startPos, d)
            const notePoint = NotePoint.add(
              transform.getNotePoint(local),
              offset
            )
            const position = quantize
              ? {
                  tick: quantizeRound(notePoint.tick),
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

              const subDraggableArea = getDraggableArea(subDraggable, minLength)

              if (subDraggableArea === null) {
                return null
              }

              const position = NotePoint.add(subDraggablePosition, delta)
              return constraintToDraggableArea(position, subDraggableArea)
            }
          )

          if (!isChanged) {
            isChanged = true
            pushHistory()
          }

          transaction(() => {
            updateDraggable(draggable, newPosition)

            subDraggables.forEach((subDraggable, i) => {
              const subDraggablePosition = newSubDraggablePositions[i]

              if (
                subDraggablePosition === null ||
                subDraggablePosition === null
              ) {
                return
              }

              updateDraggable(subDraggable, subDraggablePosition)
            })
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
