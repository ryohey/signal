import { useTheme } from "@emotion/react"
import { Rectangles } from "@ryohey/webgl-react"
import Color from "color"
import type { FC } from "react"
import { colorToVec4 } from "../../../gl/color"
import { useArrangeNotes } from "../../../hooks/useArrangeNotes"

export const Notes: FC<{ zIndex: number }> = ({ zIndex }) => {
  const notes = useArrangeNotes()
  const theme = useTheme()

  return (
    <Rectangles
      rects={notes}
      color={colorToVec4(Color(theme.themeColor))}
      zIndex={zIndex}
    />
  )
}
