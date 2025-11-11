import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import React, { useCallback } from "react"
import { useCreateOrUpdateControlEventsValue } from "../../../actions/control"
import { ValueEventType } from "../../../entities/event/ValueEventType"
import { TrackEventOf } from "../../../track"
import { GraphAxis } from "./GraphAxis"
import { LineGraphCanvas } from "./LineGraphCanvas"

export interface ItemValue {
  tick: number
  value: number
}

export interface LineGraphProps<T extends ControllerEvent | PitchBendEvent> {
  width: number
  height: number
  maxValue: number
  events: TrackEventOf<T>[]
  eventType: ValueEventType
  lineWidth?: number
  circleRadius?: number
  axis: number[]
  axisWidth: number
  axisLabelFormatter?: (value: number) => string
}

const LineGraph = <T extends ControllerEvent | PitchBendEvent>({
  maxValue,
  events,
  eventType,
  width,
  height,
  lineWidth = 2,
  circleRadius = 4,
  axis,
  axisWidth,
  axisLabelFormatter = (v) => v.toString(),
}: LineGraphProps<T>) => {
  const createOrUpdateControlEventsValue = useCreateOrUpdateControlEventsValue()

  const onClickAxis = useCallback(
    (value: number) => {
      const event = ValueEventType.getEventFactory(eventType)(value)
      createOrUpdateControlEventsValue(event)
    },
    [eventType, createOrUpdateControlEventsValue],
  )

  return (
    <div
      style={{
        display: "flex",
      }}
    >
      <GraphAxis
        width={axisWidth}
        values={axis}
        valueFormatter={axisLabelFormatter}
        onClick={onClickAxis}
      />
      <LineGraphCanvas
        width={width}
        height={height}
        maxValue={maxValue}
        lineWidth={lineWidth}
        circleRadius={circleRadius}
        events={events}
        eventType={eventType}
      />
    </div>
  )
}

export default React.memo(LineGraph)
