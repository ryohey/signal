import { useCallback } from "react"
import { Point } from "../../../entities/geometry/Point"
import { VelocityTransform } from "../../../entities/transform/VelocityTransform"
import { observeDrag2 } from "../../../helpers/observeDrag"
import { useCommands } from "../../../hooks/useCommands"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { useTickScroll } from "../../../hooks/useTickScroll"

export const useVelocityPaintGesture = ({
  velocityTransform,
}: {
  velocityTransform: VelocityTransform
}) => {
  const { transform } = useTickScroll()
  const { scrollLeft } = useTickScroll()
  const { selectedTrackId, selectedNoteIds } = usePianoRoll()
  const commands = useCommands()

  return {
    onMouseDown: useCallback(
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

            commands.track.updateVelocitiesInRange(
              selectedTrackId,
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
      [
        scrollLeft,
        commands,
        selectedTrackId,
        selectedNoteIds,
        transform,
        velocityTransform,
      ],
    ),
  }
}
