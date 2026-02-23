import { Rectangles } from "@ryohey/webgl-react"
import { vec4 } from "gl-matrix"
import { FC } from "react"

export const EditCursor: FC<{
  x: number
  height: number
  zIndex: number
}> = ({ x, height, zIndex }) => {
  // Semi-transparent blue cursor to distinguish from red playback cursor
  const color = vec4.fromValues(0.2, 0.6, 1.0, 0.7)

  return (
    <Rectangles
      rects={[
        {
          x: x - 1,
          y: 0,
          width: 2,
          height,
        },
      ]}
      color={color}
      zIndex={zIndex}
    />
  )
}
