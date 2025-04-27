import { ColorInstance } from "color"
import { vec4 } from "gl-matrix"

export const colorToVec4 = (color: ColorInstance): vec4 => {
  const rgb = color.rgb().array()
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, color.alpha()]
}

export const enhanceContrast = (
  color: ColorInstance,
  isLightContent: boolean,
  amount: number,
): ColorInstance => {
  return isLightContent ? color.lighten(amount) : color.darken(amount)
}
