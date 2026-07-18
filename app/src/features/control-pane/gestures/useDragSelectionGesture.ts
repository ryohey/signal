import {
  getControllerEventsByIds,
  moveControllerEvent,
  removeRedundantEventsForEventIds,
  updateEvents,
} from "@signal-app/core"
import { useCallback } from "react"
import { Point } from "../../../entities/geometry/Point"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { observeDrag2 } from "../../../helpers/observeDrag"
import { useMutateTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useTrackQuery } from "../../../hooks/useTrackQuery"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import { ControlCoordTransform } from "../entities/ControlCoordTransform"
import { useControlPane } from "../hooks/useControlPane"

export const useDragSelectionGesture = (): MouseDownHandler<
  [number, Point, ControlCoordTransform],
  MouseEvent
> => {
  const { selectedTrackId } = usePianoRoll()
  const query = useTrackQuery(selectedTrackId)
  const mutate = useMutateTrack(selectedTrackId)
  const { pushHistory } = useHistory()
  const { selectedEventIds: _selectedEventIds, setSelectedEventIds } =
    useControlPane()
  const { quantizeRound } = useQuantizer()

  return useCallback(
    (
      e: MouseEvent,
      hitEventId: number,
      startPoint: Point,
      transform: ControlCoordTransform,
    ) => {
      pushHistory()

      let selectedEventIds = _selectedEventIds

      if (!selectedEventIds.includes(hitEventId)) {
        setSelectedEventIds([hitEventId])
        selectedEventIds = [hitEventId]
      }

      const dragStartEvents =
        query(getControllerEventsByIds(selectedEventIds)) ?? []

      const draggedEvent = dragStartEvents.find((ev) => ev.id === hitEventId)
      if (draggedEvent === undefined) {
        return
      }

      const startValue = transform.getValue(startPoint.y)

      observeDrag2(e, {
        onMouseMove: (_e, delta) => {
          const deltaTick = transform.getTick(delta.x)
          const quantizedDraggedTick = quantizeRound(
            draggedEvent.tick + deltaTick,
          )
          const quantizedDeltaTick = quantizedDraggedTick - draggedEvent.tick

          const currentValue = transform.getValue(startPoint.y + delta.y)
          const deltaValue = currentValue - startValue

          mutate(
            updateEvents(
              dragStartEvents.map(
                moveControllerEvent(
                  quantizedDeltaTick,
                  deltaValue,
                  transform.maxValue,
                ),
              ),
            ),
          )
        },

        onMouseUp: () => {
          // Find events with the same tick and remove it
          mutate(removeRedundantEventsForEventIds(selectedEventIds))
        },
      })
    },
    [
      pushHistory,
      _selectedEventIds,
      setSelectedEventIds,
      query,
      mutate,
      quantizeRound,
    ],
  )
}
