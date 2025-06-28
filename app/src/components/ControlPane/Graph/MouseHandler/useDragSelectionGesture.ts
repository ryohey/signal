import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import { transaction } from "mobx"
import { Point } from "../../../../entities/geometry/Point"
import { ControlCoordTransform } from "../../../../entities/transform/ControlCoordTransform"
import { observeDrag2 } from "../../../../helpers/observeDrag"
import { useControlPane } from "../../../../hooks/useControlPane"
import { useHistory } from "../../../../hooks/useHistory"
import { usePianoRoll } from "../../../../hooks/usePianoRoll"
import { useQuantizer } from "../../../../hooks/useQuantizer"
import { useTrack } from "../../../../hooks/useTrack"
import { TrackEventOf } from "../../../../track"

export const useDragSelectionGesture = () => {
  const { selectedTrackId } = usePianoRoll()
  const { getEvents, updateEvents, removeRedundantEvents } =
    useTrack(selectedTrackId)
  const { pushHistory } = useHistory()
  const controlPane = useControlPane()
  const { setSelectedEventIds } = controlPane
  let { selectedEventIds } = controlPane
  const { quantizer } = useQuantizer()

  return {
    onMouseDown<T extends ControllerEvent | PitchBendEvent>(
      e: MouseEvent,
      hitEventId: number,
      startPoint: Point,
      transform: ControlCoordTransform,
    ) {
      pushHistory()

      if (!selectedEventIds.includes(hitEventId)) {
        setSelectedEventIds([hitEventId])
        selectedEventIds = [hitEventId]
      }

      const controllerEvents = getEvents()
        .filter((e) => selectedEventIds.includes(e.id))
        .map((e) => ({ ...e }) as unknown as TrackEventOf<T>) // copy

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
            quantizer.round(draggedEvent.tick + deltaTick)
          const quantizedDeltaTick = deltaTick - offsetTick

          const currentValue = transform.getValue(startPoint.y + delta.y)
          const deltaValue = currentValue - startValue

          updateEvents(
            controllerEvents.map((ev) => ({
              id: ev.id,
              tick: Math.max(0, Math.floor(ev.tick + quantizedDeltaTick)),
              value: Math.min(
                transform.maxValue,
                Math.max(0, Math.floor(ev.value + deltaValue)),
              ),
            })),
          )
        },

        onMouseUp: () => {
          // Find events with the same tick and remove it
          const controllerEvents = getEvents().filter((e) =>
            selectedEventIds.includes(e.id),
          )

          transaction(() =>
            controllerEvents.forEach((e) => removeRedundantEvents(e)),
          )
        },
      })
    },
  }
}
