import { useTheme } from "@emotion/react"
import { GLFallback, GLNode, useProjectionMatrix } from "@ryohey/webgl-react"
import Color from "color"
import { observer } from "mobx-react-lite"
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

const _VelocityItems: FC<VelocityItemsProps> = observer(({ rects, zIndex }) => {
  const projectionMatrix = useProjectionMatrix()
  const theme = useTheme()
  const baseColor = Color(theme.themeColor)
  const strokeColor = colorToVec4(
    enhanceContrast(baseColor, theme.isLightContent, 0.3),
  )
  const activeColor = useMemo(() => colorToVec4(baseColor), [theme])
  const selectedColor = useMemo(
    () => colorToVec4(baseColor.lighten(0.7)),
    [theme],
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
})
