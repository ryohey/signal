import { Point } from "../geometry/Point"
import { TickTransform } from "./TickTransform"

export class ArrangeCoordTransform {
  constructor(
    private readonly transform: TickTransform,
    private readonly pixelsPerTrack: number,
  ) {}

  getY(trackIndex: number): number {
    return trackIndex * this.pixelsPerTrack
  }

  getTrackIndex(y: number): number {
    return y / this.pixelsPerTrack
  }

  getArrangePoint(point: Point) {
    return {
      tick: this.transform.getTick(point.x),
      trackIndex: this.getTrackIndex(point.y),
    }
  }
}
