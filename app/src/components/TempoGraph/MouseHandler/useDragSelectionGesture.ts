import { TrackEventOf } from "@signal-app/core"
import { SetTempoEvent } from "midifile-ts"
import { useCallback } from "react"
import { Point } from "../../../entities/geometry/Point"
import { MouseGesture } from "../../../gesture/MouseGesture"
import { isNotUndefined } from "../../../helpers/array"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { useCommands } from "../../../hooks/useCommands"
import { useConductorTrack } from "../../../hooks/useConductorTrack"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useTempoEditor } from "../../../hooks/useTempoEditor"

export const useDragSelectionGesture = (): MouseGesture<[number]> => {
  const { getEventById } = useConductorTrack()
  const { pushHistory } = useHistory()
  const {
    setSelectedEventIds,
    transform,
    getLocal,
    selectedEventIds: _selectedEventIds,
  } = useTempoEditor()
  const { quantizeRound } = useQuantizer()
  const commands = useCommands()

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
        let lastDeltaTick = 0
        let lastDeltaValue = 0

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

            commands.conductorTrack.moveTempoEvents(
              selectedEventIds,
              quantizedDeltaTick - lastDeltaTick,
              deltaValue - lastDeltaValue,
              transform.maxBPM,
            )

            lastDeltaTick = quantizedDeltaTick
            lastDeltaValue = deltaValue
          },
          onMouseUp: () => {
            // Find events with the same tick and remove it
            commands.conductorTrack.removeRedundantEventsForEventIds(
              selectedEventIds,
            )
          },
        })
      },
      [
        pushHistory,
        getLocal,
        _selectedEventIds,
        transform,
        setSelectedEventIds,
        getEventById,
        quantizeRound,
        commands.conductorTrack,
      ],
    ),
  }
}
