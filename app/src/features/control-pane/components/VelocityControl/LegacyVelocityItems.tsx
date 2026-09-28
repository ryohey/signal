import { useTheme } from "@emotion/react"
import { Rectangles } from "@ryohey/webgl-react"
import type { Rect } from "@signal-app/geometry"
import Color from "color"
import type { FC } from "react"
import { colorToVec4 } from "../../../../gl/color"
import type { IVelocityData } from "./VelocityShader"

export const LegacyVelocityItems: FC<{ rects: (Rect & IVelocityData)[] }> = ({
  rects,
}) => {
  const theme = useTheme()
  const color = colorToVec4(Color(theme.themeColor))
  return <Rectangles rects={rects} color={color} />
}
