import { GLNode, useProjectionMatrix } from "@ryohey/webgl-react"
import { vec4 } from "gl-matrix"
import { FC } from "react"
import { Rect } from "../../../../entities/geometry/Rect"
import { DrumNoteShader } from "./DrumNoteShader"
import { IColorData } from "./NoteShader"

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
  const projectionMatrix = useProjectionMatrix()

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
