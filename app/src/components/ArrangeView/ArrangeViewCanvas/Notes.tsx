import { useTheme } from "@emotion/react"
import { Rectangles } from "@ryohey/webgl-react"
import Color from "color"
import { FC } from "react"
import { colorToVec4 } from "../../../gl/color"
import { useArrangeView } from "../../../hooks/useArrangeView"

export const Notes: FC<{ zIndex: number }> = ({ zIndex }) => {
  const { notes } = useArrangeView()
  const theme = useTheme()

  return (
    <Rectangles
      rects={notes}
      color={colorToVec4(Color(theme.themeColor))}
      zIndex={zIndex}
    />
  )
}
