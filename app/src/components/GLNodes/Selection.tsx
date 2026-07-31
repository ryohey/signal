import { useTheme } from "@emotion/react"
import { BorderedRectangles } from "@ryohey/webgl-react"
import { Rect } from "@signal-app/geometry"
import Color from "color"
import { FC, useMemo } from "react"
import { colorToVec4 } from "../../gl/color"

export interface SelectionProps {
  rect: Rect | null
  zIndex: number
  isActive: boolean
}

export const Selection: FC<SelectionProps> = ({ rect, zIndex, isActive }) => {
  const theme = useTheme()
  const fillColor = useMemo(
    () =>
      isActive
        ? colorToVec4(Color(theme.themeColor).fade(0.9))
        : colorToVec4(Color(theme.themeColor).fade(0.95)),
    [isActive, theme],
  )
  const strokeColor = useMemo(
    () =>
      isActive
        ? colorToVec4(Color(theme.themeColor))
        : colorToVec4(Color(theme.themeColor).fade(0.7)),
    [isActive, theme],
  )

  if (rect === null) {
    return <></>
  }

  return (
    <BorderedRectangles
      rects={[rect]}
      fillColor={fillColor}
      strokeColor={strokeColor}
      zIndex={zIndex}
    />
  )
}
