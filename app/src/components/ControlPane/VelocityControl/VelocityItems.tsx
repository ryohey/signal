import { useTheme } from "@emotion/react"
import { GLFallback, GLNode, useTransform } from "@ryohey/webgl-react"
import Color from "color"
import { FC, useMemo } from "react"
import { Rect } from "../../../entities/geometry/Rect"
import { colorToVec4, enhanceContrast } from "../../../gl/color"
import { LegacyVelocityItems } from "../../GLNodes/legacy/LegacyVelocityItems"
import { IVelocityData, VelocityShader } from "./VelocityShader"

export interface VelocityItemsProps {
  rects: (Rect & IVelocityData)[]
  zIndex?: number
}

export const VelocityItems: FC<VelocityItemsProps> = (props) => {
  return (
    <GLFallback
      component={_VelocityItems}
      fallback={LegacyVelocityItems}
      {...props}
    />
  )
}

const _VelocityItems: FC<VelocityItemsProps> = ({ rects, zIndex }) => {
  const projectionMatrix = useTransform()
  const theme = useTheme()
  const baseColor = Color(theme.themeColor)
  const strokeColor = colorToVec4(
    enhanceContrast(baseColor, theme.isLightContent, 0.3),
  )
  const activeColor = useMemo(() => colorToVec4(baseColor), [baseColor])
  const selectedColor = useMemo(
    () => colorToVec4(baseColor.lighten(0.7)),
    [baseColor],
  )

  return (
    <GLNode
      shader={VelocityShader}
      uniforms={{
        projectionMatrix,
        strokeColor,
        activeColor,
        selectedColor,
      }}
      buffer={rects}
      zIndex={zIndex}
    />
  )
}
