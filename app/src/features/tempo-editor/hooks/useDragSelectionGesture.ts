import { Point } from "@signal-app/geometry"
import { useCallback } from "react"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { useTempoEditor, useTempoEditorService } from "./useTempoEditor"
import { useTempoTransform } from "./useTempoTransform"

export const useDragSelectionGesture = (): MouseDownHandler<[number]> => {
  const { pushHistory } = useHistory()
  const { setSelectedEventIds, selectedEventIds: _selectedEventIds } =
    useTempoEditor()
  const tempoEditor = useTempoEditorService()
  const { transform, getLocal } = useTempoTransform()
  const { quantizeRound } = useQuantizer()

  return useCallback(
    (e: MouseEvent, hitEventId: number) => {
      pushHistory()
      const startPoint = getLocal(e)
      let selectedEventIds = _selectedEventIds

      if (!selectedEventIds.includes(hitEventId)) {
        selectedEventIds = [hitEventId]
        setSelectedEventIds(selectedEventIds)
      }

      const events = tempoEditor.getItemsByIds(selectedEventIds)

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

          tempoEditor.moveItems(
            selectedEventIds,
            quantizedDeltaTick - lastDeltaTick,
            deltaValue - lastDeltaValue,
            transform.maxBPM,
          )

          lastDeltaTick = quantizedDeltaTick
          lastDeltaValue = deltaValue
        },
        onMouseUp: () => {
          tempoEditor.removeRedundantItems(selectedEventIds)
        },
      })
    },
    [
      pushHistory,
      getLocal,
      _selectedEventIds,
      transform,
      setSelectedEventIds,
      quantizeRound,
      tempoEditor,
    ],
  )
}
