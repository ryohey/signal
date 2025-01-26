import styled from "@emotion/styled"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { GraphAxis } from "../LineGraph/GraphAxis"
import { VelocityControlCanvas } from "./VelocityControlCanvas"

export interface PianoVelocityControlProps {
  width: number
  height: number
}

const Parent = styled.div`
  display: flex;
  position: absolute;
  top: 0;
  left: 0;
`

const PianoVelocityControl: FC<PianoVelocityControlProps> = observer(
  ({ width, height }: PianoVelocityControlProps) => {
    return (
      <Parent>
        <GraphAxis values={[1, 32, 64, 96, 127]} onClick={() => {}} />
        <VelocityControlCanvas width={width} height={height} />
      </Parent>
    )
  },
)

function areEqual(
  props: PianoVelocityControlProps,
  nextProps: PianoVelocityControlProps,
) {
  return props.width === nextProps.width && props.height === nextProps.height
}

export default React.memo(PianoVelocityControl, areEqual)
