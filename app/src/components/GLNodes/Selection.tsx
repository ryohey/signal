import { useTheme } from "@emotion/react"
import { BorderedRectangles } from "@ryohey/webgl-react"
import Color from "color"
import { FC, useMemo } from "react"
import { Rect } from "../../entities/geometry/Rect"
import { colorToVec4 } from "../../gl/color"
import { usePianoRoll } from "../../hooks/usePianoRoll"

export const Selection: FC<{ rect: Rect | null; zIndex: number }> = ({
  rect,
  zIndex,
}) => {
  const theme = useTheme()
  const { activePane } = usePianoRoll()
  const isActive = useMemo(() => activePane === "notes", [activePane])
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
