import { useTheme } from "@emotion/react"
import Color from "color"
import { type FC, useMemo } from "react"
import { Layout } from "../../../../Constants"
import { colorToVec4 } from "../../../../gl/color"
import { useKeyScroll } from "../../../../hooks/useKeyScroll"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { LegacyHorizontalGrid } from "./LegacyHorizontalGrid"

export const LegacyLines: FC<{ zIndex: number }> = ({ zIndex }) => {
  const theme = useTheme()
  const { scrollTop, canvasHeight, scaleY } = useKeyScroll()
  const { canvasWidth } = useTickScroll()

  const color = useMemo(
    () => colorToVec4(Color(theme.pianoLaneEdgeColor)),
    [theme]
  )

  const hightlightedColor = useMemo(
    () => colorToVec4(Color(theme.editorGridColor)),
    [theme]
  )

  const blackLaneColor = colorToVec4(Color(theme.pianoBlackKeyLaneColor))

  return (
    <LegacyHorizontalGrid
      rect={{
        x: 0,
        y: scrollTop,
        width: canvasWidth,
        height: canvasHeight,
      }}
      color={color}
      highlightedColor={hightlightedColor}
      blackLaneColor={blackLaneColor}
      height={scaleY * Layout.keyHeight}
      zIndex={zIndex}
    />
  )
}
