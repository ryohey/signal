import { GLNode, useProjectionMatrix } from "@ryohey/webgl-react"
import { vec4 } from "gl-matrix"
import { FC } from "react"
import { Rect } from "../../../entities/geometry/Rect"
import { IVelocityData, VelocityBuffer, VelocityShader } from "./VelocityShader"

export interface VelocityItemsProps {
  rects: (Rect & IVelocityData)[]
  strokeColor: vec4
  activeColor: vec4
  selectedColor: vec4
  zIndex?: number
}

export const VelocityItems: FC<VelocityItemsProps> = ({
  rects,
  strokeColor,
  activeColor,
  selectedColor,
  zIndex,
}) => {
  const projectionMatrix = useProjectionMatrix()

  return (
    <GLNode
      shader={VelocityShader}
      uniforms={{
        projectionMatrix,
        strokeColor,
        activeColor,
        selectedColor,
      }}
      buffer={rects}
      zIndex={zIndex}
    />
  )
}
