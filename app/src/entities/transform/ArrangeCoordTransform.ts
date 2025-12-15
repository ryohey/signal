import { Point } from "../geometry/Point"
import { TickTransform } from "./TickTransform"
import { TrackTransform } from "./TrackTransform"

export class ArrangeCoordTransform {
  constructor(
    private readonly tickTransform: TickTransform,
    private readonly trackTransform: TrackTransform,
  ) {}

  getY(trackIndex: number): number {
    return this.trackTransform.getY(trackIndex)
  }

  getTrackIndex(y: number): number {
    return this.trackTransform.getTrackIndex(y)
  }

  getArrangePoint(point: Point) {
    return {
      tick: this.tickTransform.getTick(point.x),
      trackIndex: this.trackTransform.getTrackIndex(point.y),
    }
  }
}
