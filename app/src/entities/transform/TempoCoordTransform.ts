import { Point } from "../geometry/Point"
import { TickTransform } from "./TickTransform"

export class TempoCoordTransform {
  constructor(
    private readonly tickTransform: TickTransform,
    // The height of the drawing area of the graph
    readonly height: number,
    readonly maxBPM = 320,
  ) {}

  getX(tick: number) {
    return this.tickTransform.getX(tick)
  }

  getY(bpm: number) {
    return (1 - bpm / this.maxBPM) * this.height // 上下反転
  }

  getMaxY() {
    return this.height
  }

  getTick(pixels: number) {
    return this.tickTransform.getTick(pixels)
  }

  getBPM(pixels: number) {
    return (1 - pixels / this.height) * this.maxBPM
  }

  getDeltaBPM(pixels: number) {
    return (-pixels / this.height) * this.maxBPM
  }

  fromPosition(position: Point) {
    return {
      tick: this.getTick(position.x),
      bpm: this.getBPM(position.y),
    }
  }
}
