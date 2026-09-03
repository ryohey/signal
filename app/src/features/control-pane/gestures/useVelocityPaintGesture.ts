import { Point } from "@signal-app/geometry"
import { useCallback } from "react"
import { usePianoRoll } from "../../../features/piano-roll/hooks/usePianoRoll"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../helpers/observeDrag"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { VelocityTransform } from "../entities/VelocityTransform"
import { useVelocityEditor } from "../hooks/useVelocityEditor"

export const useVelocityPaintGesture = (
  velocityTransform: VelocityTransform,
): MouseDownHandler<[], React.MouseEvent> => {
  const { transform } = useTickScroll()
  const { scrollLeft } = useTickScroll()
  const { selectedNoteIds } = usePianoRoll()
  const velocityEditor = useVelocityEditor()

  return useCallback(
    (ev: React.MouseEvent) => {
      const e = ev.nativeEvent
      const startPoint = {
        x: e.offsetX + scrollLeft,
        y: e.offsetY,
      }
      const startY = e.clientY - e.offsetY

      const calcValue = (e: MouseEvent) => {
        const offsetY = e.clientY - startY
        return velocityTransform.getVelocity(offsetY)
      }

      let lastTick = transform.getTick(startPoint.x)
      let lastValue = calcValue(e)

      observeDrag2(e, {
        onMouseMove: (e, delta) => {
          const local = Point.add(startPoint, delta)
          const tick = transform.getTick(local.x)
          const value = calcValue(e)

          velocityEditor.updateVelocityInRange(
            selectedNoteIds,
            lastTick,
            lastValue,
            tick,
            value,
          )
          lastTick = tick
          lastValue = value
        },
      })
    },
    [scrollLeft, velocityEditor, selectedNoteIds, transform, velocityTransform],
  )
}
