import type { TrackEventOf } from "@signal-app/core"
import type { ControllerEvent, PitchBendEvent } from "midifile-ts"
import { useCallback } from "react"
import type { Point } from "../../../../entities/geometry/Point"
import type { ControlCoordTransform } from "../../../../entities/transform/ControlCoordTransform"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { useCommands } from "../../../../hooks/useCommands"
import { useControlPane } from "../../../../hooks/useControlPane"
import { useHistory } from "../../../../hooks/useHistory"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { useQuantizer } from "../../../../hooks/useQuantizer"
import { useTrack } from "../../../../hooks/useTrack"

type ControlGraphEvent = ControllerEvent | PitchBendEvent

export const useDragSelectionGesture = () => {
  const { selectedTrackId } = usePianoRoll()
  const { getEvents, updateEvents } = useTrack(selectedTrackId)
  const { pushHistory } = useHistory()
  const { selectedEventIds: _selectedEventIds, setSelectedEventIds } =
    useControlPane()
  const { quantizeRound } = useQuantizer()
  const commands = useCommands()

  return {
    onMouseDown: useCallback(
      (
        e: MouseEvent,
        hitEventId: number,
        startPoint: Point,
        transform: ControlCoordTransform
      ) => {
        pushHistory()

        let selectedEventIds = _selectedEventIds

        if (!selectedEventIds.includes(hitEventId)) {
          setSelectedEventIds([hitEventId])
          selectedEventIds = [hitEventId]
        }

        const controllerEvents = getEvents()
          .filter((e) => selectedEventIds.includes(e.id))
          .map((e) => ({ ...e }) as unknown as TrackEventOf<ControlGraphEvent>) // copy

        const draggedEvent = controllerEvents.find((ev) => ev.id === hitEventId)
        if (draggedEvent === undefined) {
          return
        }

        const startValue = transform.getValue(startPoint.y)

        observeDrag2(e, {
          onMouseMove: (_e, delta) => {
            const deltaTick = transform.getTick(delta.x)
            const offsetTick =
              draggedEvent.tick +
              deltaTick -
              quantizeRound(draggedEvent.tick + deltaTick)
            const quantizedDeltaTick = deltaTick - offsetTick

            const currentValue = transform.getValue(startPoint.y + delta.y)
            const deltaValue = currentValue - startValue

            updateEvents(
              controllerEvents.map((ev) => ({
                id: ev.id,
                tick: Math.max(0, Math.floor(ev.tick + quantizedDeltaTick)),
                value: Math.min(
                  transform.maxValue,
                  Math.max(0, Math.floor(ev.value + deltaValue))
                ),
              }))
            )
          },

          onMouseUp: () => {
            // Find events with the same tick and remove it
            commands.track.removeRedundantEventsForEventIds(
              selectedTrackId,
              selectedEventIds
            )
          },
        })
      },
      [
        pushHistory,
        selectedTrackId,
        _selectedEventIds,
        setSelectedEventIds,
        getEvents,
        updateEvents,
        commands,
        quantizeRound,
      ]
    ),
  }
}
