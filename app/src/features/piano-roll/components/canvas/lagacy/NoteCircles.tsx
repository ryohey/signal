import { GLNode, useTransform } from "@ryohey/webgl-react"
import type { Rect } from "@signal-app/geometry"
import type { vec4 } from "gl-matrix"
import type { FC } from "react"
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
  zIndex = 0,
}) => {
  const projectionMatrix = useTransform()

  return (
    <GLNode
      // biome-ignore lint/suspicious/noExplicitAny: not used in WebGL2 disabled environment
      shader={null as any}
      shaderFallback={DrumNoteShader}
      uniforms={{ projectionMatrix, strokeColor }}
      buffer={rects}
      zIndex={zIndex}
    />
  )
}
