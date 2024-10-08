import Color from "color"
import { vec4 } from "gl-matrix"

export const colorToVec4 = (color: Color): vec4 => {
  const rgb = color.rgb().array()
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, color.alpha()]
}

export const enhanceContrast = (
  color: Color,
  isLightContent: boolean,
  amount: number,
): Color => {
  return isLightContent ? color.lighten(amount) : color.darken(amount)
}
