import { updateVelocitiesInRange } from "@signal-app/core"
import { Point } from "@signal-app/geometry"
import { useCallback } from "react"
import { usePianoRoll } from "../../../features/piano-roll/hooks/usePianoRoll"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../helpers/observeDrag"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { VelocityTransform } from "../entities/VelocityTransform"

export const useVelocityPaintGesture = ({
  velocityTransform,
}: {
  velocityTransform: VelocityTransform
}): MouseDownHandler<[], React.MouseEvent> => {
  const { transform } = useTickScroll()
  const { scrollLeft } = useTickScroll()
  const { selectedTrackId, selectedNoteIds } = usePianoRoll()
  const mutateTrack = useMutateTrack(selectedTrackId)

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

          mutateTrack(
            updateVelocitiesInRange(
              selectedNoteIds,
              lastTick,
              lastValue,
              tick,
              value,
            ),
          )
          lastTick = tick
          lastValue = value
        },
      })
    },
    [scrollLeft, mutateTrack, selectedNoteIds, transform, velocityTransform],
  )
}
