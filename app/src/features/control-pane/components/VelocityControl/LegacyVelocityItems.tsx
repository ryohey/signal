import { useTheme } from "@emotion/react"
import { Rectangles } from "@ryohey/webgl-react"
import { Rect } from "@signal-app/geometry"
import Color from "color"
import { FC } from "react"
import { colorToVec4 } from "../../../../gl/color"
import { IVelocityData } from "./VelocityShader"

export const LegacyVelocityItems: FC<{ rects: (Rect & IVelocityData)[] }> = ({
  rects,
}) => {
  const theme = useTheme()
  const color = colorToVec4(Color(theme.themeColor))
  return <Rectangles rects={rects} color={color} />
}
