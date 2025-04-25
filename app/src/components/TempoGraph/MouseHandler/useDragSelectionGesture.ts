import { clamp } from "lodash"
import { SetTempoEvent } from "midifile-ts"
import { Point } from "../../../entities/geometry/Point"
import { TempoCoordTransform } from "../../../entities/transform/TempoCoordTransform"
import { MouseGesture } from "../../../gesture/MouseGesture"
import { isNotUndefined } from "../../../helpers/array"
import { bpmToUSecPerBeat, uSecPerBeatToBPM } from "../../../helpers/bpm"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { useHistory } from "../../../hooks/useHistory"
import { useStores } from "../../../hooks/useStores"
import { useTempoEditor } from "../../../hooks/useTempoEditor"
import { TrackEventOf } from "../../../track"

export const useDragSelectionGesture = (): MouseGesture<
  [number, Point, TempoCoordTransform]
> => {
  const { song } = useStores()
  const { pushHistory } = useHistory()
  const { selectedEventIds, setSelectedEventIds, quantizer } = useTempoEditor()

  return {
    onMouseDown(
      e: MouseEvent,
      hitEventId: number,
      startPoint: Point,
      transform: TempoCoordTransform,
    ) {
      const { conductorTrack } = song

      if (conductorTrack === undefined) {
        return
      }

      pushHistory()

      if (!selectedEventIds.includes(hitEventId)) {
        setSelectedEventIds([hitEventId])
      }

      const events = selectedEventIds
        .map(
          (id) =>
            conductorTrack.getEventById(
              id,
            ) as unknown as TrackEventOf<SetTempoEvent>,
        )
        .filter(isNotUndefined)
        .map((e) => ({ ...e })) // copy

      const draggedEvent = events.find((ev) => ev.id === hitEventId)
      if (draggedEvent === undefined) {
        return
      }

      const start = transform.fromPosition(startPoint)
      const startClientPos = getClientPos(e)

      observeDrag({
        onMouseMove: (e) => {
          const posPx = getClientPos(e)
          const deltaPx = Point.sub(posPx, startClientPos)
          const local = Point.add(startPoint, deltaPx)
          const pos = transform.fromPosition(local)
          const deltaTick = pos.tick - start.tick
          const offsetTick =
            draggedEvent.tick +
            deltaTick -
            quantizer.round(draggedEvent.tick + deltaTick)
          const quantizedDeltaTick = deltaTick - offsetTick

          const deltaValue = pos.bpm - start.bpm

          conductorTrack.updateEvents(
            events.map((ev) => ({
              id: ev.id,
              tick: Math.max(0, Math.floor(ev.tick + quantizedDeltaTick)),
              microsecondsPerBeat: Math.floor(
                bpmToUSecPerBeat(
                  clamp(
                    uSecPerBeatToBPM(ev.microsecondsPerBeat) + deltaValue,
                    0,
                    transform.maxBPM,
                  ),
                ),
              ),
            })),
          )
        },
      })
    },
  }
}
