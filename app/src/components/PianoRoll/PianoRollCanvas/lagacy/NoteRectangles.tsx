import { GLNode, useTransform } from "@ryohey/webgl-react"
import type { vec4 } from "gl-matrix"
import type { FC } from "react"
import type { Rect } from "../../../../entities/geometry/Rect"
import { type IColorData, NoteShader } from "./NoteShader"

export interface NoteRectanglesProps {
  rects: (Rect & IColorData)[]
  strokeColor: vec4
  zIndex?: number
}

export const NoteRectangles: FC<NoteRectanglesProps> = ({
  rects,
  strokeColor,
  zIndex,
}) => {
  const projectionMatrix = useTransform()

  return (
    <GLNode
      shader={null as any}
      shaderFallback={NoteShader}
      uniforms={{ projectionMatrix, strokeColor }}
      buffer={rects}
      zIndex={zIndex}
    />
  )
}
