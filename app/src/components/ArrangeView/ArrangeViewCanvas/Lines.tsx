import { useTheme } from "@emotion/react"
import { Rectangles } from "@ryohey/webgl-react"
import Color from "color"
import { FC, useMemo } from "react"
import { Rect } from "../../../entities/geometry/Rect"
import { colorToVec4 } from "../../../gl/color"
import { useArrangeView } from "../../../hooks/useArrangeView"

export const Lines: FC<{ width: number; zIndex: number }> = ({
  width,
  zIndex,
}) => {
  const { tracks, trackTransform } = useArrangeView()
  const theme = useTheme()

  const hline = (y: number): Rect => ({
    x: 0,
    y,
    width,
    height: 1,
  })

  const rects = useMemo(
    () => tracks.map((_, i) => trackTransform.getY(i + 1) - 1).map(hline),
    [tracks.length, width, trackTransform],
  )

  const color = colorToVec4(Color(theme.dividerColor))

  return <Rectangles rects={rects} color={color} zIndex={zIndex} />
}
