import {
  getSetTempoEventsByIds,
  moveTempoEvents,
  removeRedundantEventsForEventIds,
} from "@signal-app/core"
import { useCallback } from "react"
import { Point } from "../../../entities/geometry/Point"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { useMutateConductorTrack } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useConductorTrackQuery } from "../../../hooks/useTrackQuery"
import { useTempoEditor } from "./useTempoEditor"
import { useTempoTransform } from "./useTempoTransform"

export const useDragSelectionGesture = (): MouseDownHandler<[number]> => {
  const { pushHistory } = useHistory()
  const { setSelectedEventIds, selectedEventIds: _selectedEventIds } =
    useTempoEditor()
  const { transform, getLocal } = useTempoTransform()
  const { quantizeRound } = useQuantizer()
  const mutate = useMutateConductorTrack()
  const query = useConductorTrackQuery()

  return useCallback(
    (e: MouseEvent, hitEventId: number) => {
      pushHistory()
      const startPoint = getLocal(e)
      let selectedEventIds = _selectedEventIds

      if (!selectedEventIds.includes(hitEventId)) {
        selectedEventIds = [hitEventId]
        setSelectedEventIds(selectedEventIds)
      }

      const events =
        query(getSetTempoEventsByIds(selectedEventIds))?.map((e) => ({
          ...e, // copy
        })) ?? []

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

          console.log(
            `deltaTick: ${deltaTick}, quantizedDeltaTick: ${quantizedDeltaTick}, deltaValue: ${deltaValue}`,
          )

          mutate(
            moveTempoEvents(
              selectedEventIds,
              quantizedDeltaTick - lastDeltaTick,
              deltaValue - lastDeltaValue,
              transform.maxBPM,
            ),
          )

          lastDeltaTick = quantizedDeltaTick
          lastDeltaValue = deltaValue
        },
        onMouseUp: () => {
          // Find events with the same tick and remove it
          mutate(removeRedundantEventsForEventIds(selectedEventIds))
        },
      })
    },
    [
      pushHistory,
      getLocal,
      _selectedEventIds,
      transform,
      setSelectedEventIds,
      query,
      quantizeRound,
      mutate,
    ],
  )
}
