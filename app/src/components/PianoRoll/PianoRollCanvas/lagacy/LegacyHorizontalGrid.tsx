import { GLNode, useProjectionMatrix } from "@ryohey/webgl-react"
import { vec4 } from "gl-matrix"
import { FC } from "react"
import { Rect } from "../../../../entities/geometry/Rect"
import { HorizontalGridShader } from "./HorizontalGridShader"

export interface LegacyHorizontalGridProps {
  rect: Rect
  color: vec4
  highlightedColor: vec4
  blackLaneColor: vec4
  height: number
  zIndex?: number
}

export const LegacyHorizontalGrid: FC<LegacyHorizontalGridProps> = ({
  rect,
  color,
  highlightedColor,
  blackLaneColor,
  height,
  zIndex,
}) => {
  const projectionMatrix = useProjectionMatrix()

  return (
    <GLNode
      shader={null as any}
      shaderFallback={HorizontalGridShader}
      uniforms={{
        projectionMatrix,
        color,
        highlightedColor,
        blackLaneColor,
        height,
      }}
      buffer={rect}
      zIndex={zIndex}
    />
  )
}
