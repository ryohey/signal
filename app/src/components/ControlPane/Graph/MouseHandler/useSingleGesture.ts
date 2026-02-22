import { useCreateEvent } from "../../../../actions"
import { ValueEventType } from "../../../../entities/event/ValueEventType"
import { Point } from "../../../../entities/geometry/Point"
import { ControlCoordTransform } from "../../../../entities/transform/ControlCoordTransform"
import { MouseGesture } from "../../../../gesture/MouseGesture"
import { useControlPane } from "../../../../hooks/useControlPane"
import { useHistory } from "../../../../hooks/useHistory"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"

export const useSingleGesture = (
  type: ValueEventType,
): MouseGesture<[Point, ControlCoordTransform]> => {
  const { setSelection: setPianoRollSelection, setSelectedNoteIds } =
    usePianoRoll()
  const { setSelectedEventIds, setSelection } = useControlPane()
  const createTrackEvent = useCreateEvent()
  const { pushHistory } = useHistory()
  const eventFactory = ValueEventType.getEventFactory(type)

  return {
    onMouseDown(_e, startPoint, transform) {
      pushHistory()

      setSelectedEventIds([])
      setSelection(null)
      setPianoRollSelection(null)
      setSelectedNoteIds([])

      const pos = transform.fromPosition(startPoint)
      const event = eventFactory(pos.value)
      createTrackEvent(event, pos.tick)
    },
  }
}
