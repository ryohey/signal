import { useCallback } from "react"
import type { MouseDownHandler } from "../../../gesture/MouseGesture"
import { observeDrag } from "../../../helpers/observeDrag"
import type { VelocityTransform } from "../entities/VelocityTransform"
import { useChangeNotesVelocity } from "../hooks/useChangeNotesVelocity"

export const useDragVelocityGesture = (
  velocityTransform: VelocityTransform,
): MouseDownHandler<[number]> => {
  const changeNotesVelocity = useChangeNotesVelocity()

  return useCallback(
    (e: MouseEvent, noteId: number) => {
      const startY = e.clientY - e.offsetY
      const calcValue = (e: MouseEvent) => {
        const offsetY = e.clientY - startY
        return velocityTransform.getVelocity(offsetY)
      }

      e.stopPropagation()
      changeNotesVelocity([noteId], calcValue(e))

      observeDrag({
        onMouseMove: (e) => changeNotesVelocity([noteId], calcValue(e)),
      })
    },
    [changeNotesVelocity, velocityTransform],
  )
}
