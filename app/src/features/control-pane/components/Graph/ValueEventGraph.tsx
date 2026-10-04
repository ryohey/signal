import { ValueEventType } from "@signal-app/control-editor"
import type { Size } from "@signal-app/geometry"
import React, { type FC, useMemo } from "react"
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

const labelFormatterForType =
  (type: ValueEventType) =>
  (v: number): string =>
    ValueEventType.toDisplayValue(type, v).toString()

export const ValueEventGraph: FC<ValueEventGraphProps> = React.memo(
  ({ width, height, type, axisWidth }) => {
    const axis = useMemo(() => axisForType(type), [type])
    const maxValue = useMemo(() => maxValueForType(type), [type])
    const labelFormatter = useMemo(() => labelFormatterForType(type), [type])

    return (
      <LineGraphControl
        width={width}
        height={height}
        maxValue={maxValue}
        axis={axis}
        axisWidth={axisWidth}
        axisLabelFormatter={labelFormatter}
      />
    )
  },
)
