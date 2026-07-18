import { Range, updateEventsInRange } from "@signal-app/core"
import { useCallback } from "react"
import { Point } from "../../../entities/geometry/Point"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { ControlCoordTransform } from "../entities/ControlCoordTransform"
import { ValueEventType } from "../entities/ValueEventType"
import { useControlPane } from "../hooks/useControlPane"
import { useCreateEvent } from "../hooks/useCreateEvent"

const useUpdateValueEvents = (type: ValueEventType) => {
  const { selectedTrackId } = usePianoRoll()
  const mutate = useMutateTrack(selectedTrackId)
  const { quantizeFloor, quantizeUnit } = useQuantizer()

  return useCallback(
    (valueRange: Range, tickRange: Range) => {
      mutate(
        updateEventsInRange(
          ValueEventType.getEventPredicate(type),
          ValueEventType.getEventFactory(type),
          quantizeFloor,
          quantizeUnit,
          valueRange,
          tickRange,
        ),
      )
    },
    [mutate, type, quantizeFloor, quantizeUnit],
  )
}

export const usePencilGesture = (
  type: ValueEventType,
): MouseDownHandler<[Point, ControlCoordTransform]> => {
  const { setSelection: setPianoRollSelection, setSelectedNoteIds } =
    usePianoRoll()
  const { setSelectedEventIds, setSelection } = useControlPane()
  const createTrackEvent = useCreateEvent()
  const { pushHistory } = useHistory()
  const updateValueEvents = useUpdateValueEvents(type)
  const eventFactory = ValueEventType.getEventFactory(type)

  return useCallback(
    (e, startPoint, transform) => {
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
            Math.min(transform.maxValue, transform.fromPosition(local).value),
          )
          const tick = transform.getTick(local.x)

          updateValueEvents(
            Range.fromUnordered(lastValue, value),
            Range.fromUnordered(lastTick, tick),
          )

          lastTick = tick
          lastValue = value
        },
      })
    },
    [
      createTrackEvent,
      eventFactory,
      pushHistory,
      setPianoRollSelection,
      setSelectedEventIds,
      setSelection,
      setSelectedNoteIds,
      updateValueEvents,
    ],
  )
}
