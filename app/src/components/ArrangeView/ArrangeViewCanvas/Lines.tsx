import { useTheme } from "@emotion/react"
import { Rectangles } from "@ryohey/webgl-react"
import Color from "color"
import { range } from "lodash"
import { FC, useCallback, useMemo } from "react"
import { Rect } from "../../../entities/geometry/Rect"
import { colorToVec4 } from "../../../gl/color"
import { useArrangeView } from "../../../hooks/useArrangeView"
import { useSong } from "../../../hooks/useSong"

export const Lines: FC<{ width: number; zIndex: number }> = ({
  width,
  zIndex,
}) => {
  const { trackTransform } = useArrangeView()
  const { tracks } = useSong()
  const theme = useTheme()

  const hline = useCallback(
    (y: number): Rect => ({
      x: 0,
      y,
      width,
      height: 1,
    }),
    [width],
  )

  const trackCount = tracks.length

  const rects = useMemo(
    () =>
      range(trackCount)
        .map((_, i) => trackTransform.getY(i + 1) - 1)
        .map(hline),
    [trackCount, trackTransform, hline],
  )

  const color = colorToVec4(Color(theme.dividerColor))

  return <Rectangles rects={rects} color={color} zIndex={zIndex} />
}
