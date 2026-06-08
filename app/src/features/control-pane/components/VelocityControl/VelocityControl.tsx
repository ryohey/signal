import styled from "@emotion/styled"
import React, { FC } from "react"
import { GraphAxis } from "../LineGraph/GraphAxis"
import { VelocityControlCanvas } from "./VelocityControlCanvas"

export interface PianoVelocityControlProps {
  width: number
  height: number
  axisWidth: number
}

const Parent = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
`

const PianoVelocityControl: FC<PianoVelocityControlProps> = ({
  width,
  height,
  axisWidth,
}: PianoVelocityControlProps) => {
  return (
    <Parent>
      <GraphAxis
        width={axisWidth}
        values={[1, 32, 64, 96, 127]}
        onClick={() => {}}
      />
      <VelocityControlCanvas width={width} height={height} />
    </Parent>
  )
}

export default React.memo(PianoVelocityControl)
