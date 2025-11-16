import { Range } from "@signal-app/core"
import { Measure } from "../measure/Measure"
import { TickTransform } from "../transform/TickTransform"
import { Beat } from "./Beat"

export type BeatWithX = Beat & {
  readonly x: number
}

export namespace BeatWithX {
  export const createInRange = (
    allMeasures: Measure[],
    transform: TickTransform,
    timebase: number,
    scrollLeft: number,
    width: number,
  ): BeatWithX[] => {
    return Beat.createInRange(
      allMeasures,
      timebase,
      Range.fromLength(transform.getTick(scrollLeft), transform.getTick(width)),
    ).map((b) => ({
      ...b,
      x: Math.round(transform.getX(b.tick)),
    }))
  }
}
