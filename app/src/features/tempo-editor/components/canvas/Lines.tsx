import { useTheme } from "@emotion/react"
import { Rectangles } from "@ryohey/webgl-react"
import { Rect } from "@signal-app/geometry"
import Color from "color"
import { range } from "lodash"
import { FC } from "react"
import { colorToVec4 } from "../../../../gl/color"
import { useTempoTransform } from "../../hooks/useTempoTransform"

export const Lines: FC<{ width: number; zIndex: number }> = ({
  width,
  zIndex,
}) => {
  const { transform } = useTempoTransform()
  const theme = useTheme()

  const hline = (y: number): Rect => ({
    x: 0,
    y,
    width,
    height: 1,
  })

  // 30 -> 510 = 17 Divided line
  const rects = range(30, transform.maxBPM, 30)
    .map((i) => transform.getY(i))
    .map(hline)
  const color = colorToVec4(Color(theme.dividerColor))

  return <Rectangles rects={rects} color={color} zIndex={zIndex} />
}
