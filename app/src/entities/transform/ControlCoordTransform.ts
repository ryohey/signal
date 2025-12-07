import type { ItemValue } from "../../components/ControlPane/LineGraph/LineGraph"
import type { Point } from "../geometry/Point"
import type { Rect } from "../geometry/Rect"
import type { ControlSelection } from "../selection/ControlSelection"
import type { TickTransform } from "./TickTransform"

export class ControlCoordTransform {
  constructor(
    private readonly transform: TickTransform,
    readonly maxValue: number,
    readonly height: number,
    readonly lineWidth: number
  ) {}

  getX(tick: number) {
    return this.transform.getX(tick)
  }

  getTick(pixels: number) {
    return Math.floor(this.transform.getTick(pixels))
  }

  getY(value: number) {
    return (
      (1 - value / this.maxValue) * (this.height - this.lineWidth * 2) +
      this.lineWidth
    )
  }

  getValue(y: number) {
    return Math.floor(
      (1 - (y - this.lineWidth) / (this.height - this.lineWidth * 2)) *
        this.maxValue
    )
  }

  toPosition(tick: number, value: number): Point {
    return {
      x: Math.round(this.getX(tick)),
      y: Math.round(this.getY(value)),
    }
  }

  fromPosition(position: Point): ItemValue {
    return {
      tick: this.getTick(position.x),
      value: this.getValue(position.y),
    }
  }

  transformSelection(selection: ControlSelection): Rect {
    const x = this.getX(selection.fromTick)
    return {
      x,
      y: 0,
      width: this.getX(selection.toTick) - x,
      height: this.height,
    }
  }
}
