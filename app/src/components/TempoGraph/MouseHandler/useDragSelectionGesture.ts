import { clamp } from "lodash"
import { SetTempoEvent } from "midifile-ts"
import { useCallback } from "react"
import { Point } from "../../../entities/geometry/Point"
import { MouseGesture } from "../../../gesture/MouseGesture"
import { isNotUndefined } from "../../../helpers/array"
import { bpmToUSecPerBeat, uSecPerBeatToBPM } from "../../../helpers/bpm"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { useConductorTrack } from "../../../hooks/useConductorTrack"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useTempoEditor } from "../../../hooks/useTempoEditor"
import { TrackEventOf } from "../../../track"

export const useDragSelectionGesture = (): MouseGesture<[number]> => {
  const { getEventById, updateEvents } = useConductorTrack()
  const { pushHistory } = useHistory()
  const {
    setSelectedEventIds,
    transform,
    getLocal,
    selectedEventIds: _selectedEventIds,
  } = useTempoEditor()
  const { quantizeRound } = useQuantizer()

  return {
    onMouseDown: useCallback(
      (e: MouseEvent, hitEventId: number) => {
        pushHistory()
        const startPoint = getLocal(e)
        let selectedEventIds = _selectedEventIds

        if (!selectedEventIds.includes(hitEventId)) {
          selectedEventIds = [hitEventId]
          setSelectedEventIds(selectedEventIds)
        }

        const events = selectedEventIds
          .map(
            (id) => getEventById(id) as unknown as TrackEventOf<SetTempoEvent>,
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
              quantizeRound(draggedEvent.tick + deltaTick)
            const quantizedDeltaTick = deltaTick - offsetTick

            const deltaValue = pos.bpm - start.bpm

            updateEvents(
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
      [
        pushHistory,
        _selectedEventIds,
        setSelectedEventIds,
        getEventById,
        updateEvents,
        transform,
        getLocal,
        quantizeRound,
      ],
    ),
  }
}
