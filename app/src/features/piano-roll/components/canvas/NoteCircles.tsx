import { GLNode, useTransform } from "@ryohey/webgl-react"
import type { Rect } from "@signal-app/geometry"
import type { vec4 } from "gl-matrix"
import type { FC } from "react"
import { DrumNoteShader } from "./shaders/DrumNoteShader"
import type { INoteData } from "./shaders/NoteShader"

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
  zIndex = 0,
}) => {
  const projectionMatrix = useTransform()

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
