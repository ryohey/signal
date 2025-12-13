import { GLNode, useTransform } from "@ryohey/webgl-react"
import type { vec4 } from "gl-matrix"
import type { FC } from "react"
import type { Rect } from "../../../../entities/geometry/Rect"
import { DrumNoteShader } from "./DrumNoteShader"
import type { IColorData } from "./NoteShader"

export interface NoteCirclesProps {
  rects: (Rect & IColorData)[]
  strokeColor: vec4
  zIndex?: number
}

export const NoteCircles: FC<NoteCirclesProps> = ({
  rects,
  strokeColor,
  zIndex,
}) => {
  const projectionMatrix = useTransform()

  return (
    <GLNode
      shader={null as any}
      shaderFallback={DrumNoteShader}
      uniforms={{ projectionMatrix, strokeColor }}
      buffer={rects}
      zIndex={zIndex}
    />
  )
}
