import { GLNode, useTransform } from "@ryohey/webgl-react"
import { Rect } from "@signal-app/geometry"
import { vec4 } from "gl-matrix"
import { FC } from "react"
import { IColorData, NoteShader } from "./NoteShader"

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
      // biome-ignore lint/suspicious/noExplicitAny: not used in WebGL2 disabled environment
      shader={null as any}
      shaderFallback={NoteShader}
      uniforms={{ projectionMatrix, strokeColor }}
      buffer={rects}
      zIndex={zIndex}
    />
  )
}
