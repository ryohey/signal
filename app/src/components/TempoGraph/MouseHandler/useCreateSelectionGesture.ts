import { Range } from "@signal-app/core"
import { Point } from "../../../entities/geometry/Point"
import { TempoSelection } from "../../../entities/selection/TempoSelection"
import { TempoCoordTransform } from "../../../entities/transform/TempoCoordTransform"
import { MouseGesture } from "../../../gesture/MouseGesture"
import { isEventInRange } from "../../../helpers/filterEvents"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { useConductorTrack } from "../../../hooks/useConductorTrack"
import { useTempoEditor } from "../../../hooks/useTempoEditor"
import { isSetTempoEvent } from "../../../track"

export const useCreateSelectionGesture = (): MouseGesture<
  [Point, TempoCoordTransform]
> => {
  const { setSelectedEventIds, setSelection } = useTempoEditor()
  const { getEvents } = useConductorTrack()
  let selection: TempoSelection | null = null

  return {
    onMouseDown(e, startPoint, transform) {
      const start = transform.fromPosition(startPoint)
      const startClientPos = getClientPos(e)

      setSelectedEventIds([])

      selection = {
        fromTick: start.tick,
        toTick: start.tick,
      }
      setSelection(selection)

      observeDrag({
        onMouseMove: (e) => {
          const posPx = getClientPos(e)
          const deltaPx = Point.sub(posPx, startClientPos)
          const local = Point.add(startPoint, deltaPx)
          const end = transform.fromPosition(local)
          selection = {
            fromTick: Math.min(start.tick, end.tick),
            toTick: Math.max(start.tick, end.tick),
          }
          setSelection(selection)
        },
        onMouseUp: () => {
          if (selection === null) {
            return
          }

          setSelectedEventIds(
            getEvents()
              .filter(isSetTempoEvent)
              .filter(
                isEventInRange(
                  Range.create(selection.fromTick, selection.toTick),
                ),
              )
              .map((e) => e.id),
          )
          setSelection(null)
        },
      })
    },
  }
}
