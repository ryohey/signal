import { useCreateEvent, useUpdateValueEvents } from "../../../../actions"
import { ValueEventType } from "../../../../entities/event/ValueEventType"
import { Point } from "../../../../entities/geometry/Point"
import type { ControlCoordTransform } from "../../../../entities/transform/ControlCoordTransform"
import type { MouseGesture } from "../../../../gesture/MouseGesture"
import { getClientPos } from "../../../../helpers/mouseEvent"
import { observeDrag } from "../../../../helpers/observeDrag"
import { useControlPane } from "../../../../hooks/useControlPane"
import { useHistory } from "../../../../hooks/useHistory"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"

export const usePencilGesture = (
  type: ValueEventType
): MouseGesture<[Point, ControlCoordTransform]> => {
  const { setSelection: setPianoRollSelection, setSelectedNoteIds } =
    usePianoRoll()
  const { setSelectedEventIds, setSelection } = useControlPane()
  const createTrackEvent = useCreateEvent()
  const { pushHistory } = useHistory()
  const updateValueEvents = useUpdateValueEvents(type)
  const eventFactory = ValueEventType.getEventFactory(type)

  return {
    onMouseDown(e, startPoint, transform) {
      pushHistory()

      setSelectedEventIds([])
      setSelection(null)
      setPianoRollSelection(null)
      setSelectedNoteIds([])

      const startClientPos = getClientPos(e)
      const pos = transform.fromPosition(startPoint)

      const event = eventFactory(pos.value)
      createTrackEvent(event, pos.tick)

      let lastTick = pos.tick
      let lastValue = pos.value

      observeDrag({
        onMouseMove: (e) => {
          const posPx = getClientPos(e)
          const deltaPx = Point.sub(posPx, startClientPos)
          const local = Point.add(startPoint, deltaPx)
          const value = Math.max(
            0,
            Math.min(transform.maxValue, transform.fromPosition(local).value)
          )
          const tick = transform.getTick(local.x)

          updateValueEvents(lastValue, value, lastTick, tick)

          lastTick = tick
          lastValue = value
        },
      })
    },
  }
}
