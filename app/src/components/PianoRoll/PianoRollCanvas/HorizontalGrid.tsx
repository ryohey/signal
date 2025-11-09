import { GLNode, useTransform } from "@ryohey/webgl-react"
import { vec4 } from "gl-matrix"
import { FC } from "react"
import { Rect } from "../../../entities/geometry/Rect"
import { HorizontalGridShader } from "./shaders/HorizontalGridShader"

export interface HorizontalGridProps {
  rect: Rect
  color: vec4
  highlightedColor: vec4
  laneColors: Float32Array // 12 colors x 4 rgba
  height: number
  zIndex?: number
}

export const HorizontalGrid: FC<HorizontalGridProps> = ({
  rect,
  color,
  highlightedColor,
  laneColors,
  height,
  zIndex,
}) => {
  const projectionMatrix = useTransform()

  return (
    <GLNode
      shader={HorizontalGridShader}
      uniforms={{
        projectionMatrix,
        color,
        highlightedColor,
        laneColors,
        height,
      }}
      buffer={rect}
      zIndex={zIndex}
    />
  )
}
