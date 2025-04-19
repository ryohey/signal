import { GLNode, useProjectionMatrix } from "@ryohey/webgl-react"
import { vec4 } from "gl-matrix"
import { FC } from "react"
import { Rect } from "../../../entities/geometry/Rect"
import { DrumNoteShader } from "./shaders/DrumNoteShader"
import { INoteData } from "./shaders/NoteShader"

export interface NoteCirclesProps {
  rects: (Rect & INoteData)[]
  strokeColor: vec4
  inactiveColor: vec4
  activeColor: vec4
  selectedColor: vec4
  zIndex?: number
}

export const NoteCircles: FC<NoteCirclesProps> = ({
  rects,
  strokeColor,
  selectedColor,
  inactiveColor,
  activeColor,
  zIndex,
}) => {
  const projectionMatrix = useProjectionMatrix()

  return (
    <GLNode
      shader={DrumNoteShader}
      uniforms={{
        projectionMatrix,
        strokeColor,
        selectedColor,
        inactiveColor,
        activeColor,
      }}
      buffer={rects}
      zIndex={zIndex}
    />
  )
}
