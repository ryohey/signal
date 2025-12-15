import { GLNode, useTransform } from "@ryohey/webgl-react"
import { vec4 } from "gl-matrix"
import { FC } from "react"
import { VerticalLinesShader } from "./VerticalLinesShader"

export interface VerticalLinesProps {
  xArray: number[]
  color: vec4
  height: number
  lineWidth: number
  zIndex?: number
}

export const VerticalLines: FC<VerticalLinesProps> = ({
  xArray,
  color,
  height,
  lineWidth,
  zIndex,
}) => {
  const projectionMatrix = useTransform()

  return (
    <GLNode
      shader={VerticalLinesShader}
      uniforms={{
        projectionMatrix,
        color,
        height,
        lineWidth,
      }}
      buffer={xArray}
      zIndex={zIndex}
    />
  )
}
