import { Rect } from "../geometry/Rect"
import { TempoCoordTransform } from "../transform/TempoCoordTransform"

export interface TempoSelection {
  readonly fromTick: number
  readonly toTick: number
}

export namespace TempoSelection {
  export const getBounds = (
    selection: TempoSelection,
    transform: TempoCoordTransform,
  ): Rect => {
    const left = transform.getX(selection.fromTick)
    const right = transform.getX(selection.toTick)
    return {
      x: left,
      y: 0,
      width: right - left,
      height: transform.height,
    }
  }
}
