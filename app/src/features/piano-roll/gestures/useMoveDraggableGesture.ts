import { Range } from "@signal-app/core"
import { useCallback } from "react"
import { Point } from "../../../entities/geometry/Point"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../helpers/observeDrag"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { NotePoint } from "../entities/NotePoint"
import { useNoteCoordTransform } from "../hooks/useNoteCoordTransform"
import {
  DraggableArea,
  PianoRollDraggable,
  usePianoRollDraggable,
} from "../hooks/usePianoRollDraggable"

const MIN_LENGTH = 10

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

export const useMoveDraggableGesture = (): MouseDownHandler<
  [PianoRollDraggable, PianoRollDraggable[]?, MoveDraggableCallback?]
> => {
  const { transform, getLocal } = useNoteCoordTransform()
  const {
    isQuantizeEnabled,
    quantize: quantizeUnit,
    quantizeRound,
  } = useQuantizer()
  const { getDraggablePosition, getDraggableArea, updateDraggables } =
    usePianoRollDraggable()

  const { pushHistory } = useHistory()

  return useCallback(
    (e, draggable, subDraggables = [], callback = {}) => {
      const draggablePosition = getDraggablePosition(draggable)

      if (draggablePosition === null) {
        return
      }

      let isChanged = false

      const startPos = getLocal(e)
      const notePoint = transform.getNotePoint(startPos)
      const offset = NotePoint.sub(draggablePosition, notePoint)

      const subDraggablePositions = subDraggables.map((subDraggable) =>
        getDraggablePosition(subDraggable),
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
              offset,
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
            },
          )

          if (!isChanged) {
            isChanged = true
            pushHistory()
          }

          const updates = [
            { draggable, position: newPosition },
            ...subDraggables.flatMap((subDraggable, i) => {
              const position = newSubDraggablePositions[i]
              if (position === null) {
                return []
              }
              return [{ draggable: subDraggable, position }]
            }),
          ]

          updateDraggables(updates)

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
    [
      getDraggablePosition,
      getDraggableArea,
      updateDraggables,
      transform,
      getLocal,
      isQuantizeEnabled,
      quantizeUnit,
      quantizeRound,
      pushHistory,
    ],
  )
}
