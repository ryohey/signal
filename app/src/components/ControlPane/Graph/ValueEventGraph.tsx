import { MIDIControlEvents } from "midifile-ts"
import React, { FC, useMemo } from "react"
import { ValueEventType } from "../../../entities/event/ValueEventType"
import { Size } from "../../../entities/geometry/Size"
import { useControlValueEvents } from "../../../hooks/useControlValueEvents"
import LineGraphControl from "../LineGraph/LineGraph"

export type ValueEventGraphProps = Size & {
  type: ValueEventType
  axisWidth: number
}

const axisForType = (type: ValueEventType) => {
  switch (type.type) {
    case "controller":
      return [0, 0x20, 0x40, 0x60, 0x80 - 1]
    case "pitchBend":
      return [0, 0x1000, 0x2000, 0x3000, 0x4000 - 1]
  }
}

const maxValueForType = (type: ValueEventType) => {
  switch (type.type) {
    case "controller":
      return 127
    case "pitchBend":
      return 0x4000
  }
}

const labelFormatterForType = (
  type: ValueEventType,
): ((v: number) => string) => {
  switch (type.type) {
    case "controller":
      switch (type.controllerType) {
        case MIDIControlEvents.MSB_PAN:
          return (v) => (v - 0x40).toString()
        default:
          return (v) => v.toString()
      }
    case "pitchBend":
      return (v) => (v - 0x2000).toString()
    default:
      return (v) => v.toString()
  }
}

export const ValueEventGraph: FC<ValueEventGraphProps> = React.memo(
  ({ width, height, type, axisWidth }) => {
    const events = useControlValueEvents()

    const axis = useMemo(() => axisForType(type), [type])
    const maxValue = useMemo(() => maxValueForType(type), [type])
    const labelFormatter = useMemo(() => labelFormatterForType(type), [type])

    return (
      <LineGraphControl
        width={width}
        height={height}
        maxValue={maxValue}
        events={events}
        axis={axis}
        axisWidth={axisWidth}
        eventType={type}
        axisLabelFormatter={labelFormatter}
      />
    )
  },
)
