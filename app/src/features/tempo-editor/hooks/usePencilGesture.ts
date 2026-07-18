import {
  bpmToUSecPerBeat,
  isSetTempoEvent,
  Range,
  setTempoMidiEvent,
  updateEventsInRange,
} from "@signal-app/core"
import { useCallback } from "react"
import { Point } from "../../../entities/geometry/Point"
import { MouseDownHandler } from "../../../gesture/MouseGesture"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { useMutateConductorTrack } from "../../../hooks/useCommand"
import { useConductorTrack } from "../../../hooks/useConductorTrack"
import { useHistory } from "../../../hooks/useHistory"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { TempoCoordTransform } from "../entities/TempoCoordTransform"

const useUpdateTempoEventsInRange = () => {
  const { quantizeFloor, quantizeUnit } = useQuantizer()
  const mutate = useMutateConductorTrack()

  return useCallback(
    (valueRange: Range, tickRange: Range) => {
      mutate(
        updateEventsInRange(
          isSetTempoEvent,
          (v) => setTempoMidiEvent(0, bpmToUSecPerBeat(v)),
          quantizeFloor,
          quantizeUnit,
          valueRange,
          tickRange,
        ),
      )
    },
    [mutate, quantizeFloor, quantizeUnit],
  )
}

export const usePencilGesture = (): MouseDownHandler<
  [Point, TempoCoordTransform]
> => {
  const { pushHistory } = useHistory()
  const { quantizeRound } = useQuantizer()
  const { createOrUpdate } = useConductorTrack()
  const updateTempoEventsInRange = useUpdateTempoEventsInRange()

  return useCallback(
    (e, startPoint, transform) => {
      pushHistory()

      const startClientPos = getClientPos(e)
      const pos = transform.fromPosition(startPoint)
      const bpm = bpmToUSecPerBeat(pos.bpm)

      const event = {
        ...setTempoMidiEvent(0, Math.round(bpm)),
        tick: quantizeRound(pos.tick),
      }
      createOrUpdate(event)

      let lastTick = pos.tick
      let lastValue = pos.bpm

      observeDrag({
        onMouseMove: (e) => {
          const posPx = getClientPos(e)
          const deltaPx = Point.sub(posPx, startClientPos)
          const local = Point.add(startPoint, deltaPx)
          const value = Math.max(
            0,
            Math.min(transform.maxBPM, transform.fromPosition(local).bpm),
          )
          const tick = transform.getTick(local.x)

          updateTempoEventsInRange(
            Range.fromUnordered(lastValue, value),
            Range.fromUnordered(lastTick, tick),
          )

          lastTick = tick
          lastValue = value
        },
      })
    },
    [pushHistory, quantizeRound, createOrUpdate, updateTempoEventsInRange],
  )
}
