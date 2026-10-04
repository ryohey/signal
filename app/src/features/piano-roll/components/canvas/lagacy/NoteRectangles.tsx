import { GLNode, useTransform } from "@ryohey/webgl-react"
import type { Rect } from "@signal-app/geometry"
import type { vec4 } from "gl-matrix"
import type { FC } from "react"
import { type IColorData, NoteShader } from "./NoteShader"

export interface NoteRectanglesProps {
  rects: (Rect & IColorData)[]
  strokeColor: vec4
  zIndex?: number
}

export const NoteRectangles: FC<NoteRectanglesProps> = ({
  rects,
  strokeColor,
  zIndex = 0,
}) => {
  const projectionMatrix = useTransform()

  return (
    <GLNode
      // biome-ignore lint/suspicious/noExplicitAny: not used in WebGL2 disabled environment
      shader={null as any}
      shaderFallback={NoteShader}
      uniforms={{ projectionMatrix, strokeColor }}
      buffer={rects}
      zIndex={zIndex}
    />
  )
}
