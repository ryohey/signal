import type { Range } from "@signal-app/core"
import { Measure } from "../measure/Measure"

export interface Beat {
  readonly measure: number
  readonly beat: number
  readonly tick: number
}

export namespace Beat {
  export const createInRange = (
    allMeasures: Measure[],
    timebase: number,
    tickRange: Range
  ): Beat[] => {
    const beats: Beat[] = []
    const measures = Measure.getMeasuresInRange(allMeasures, tickRange)

    measures.forEach((measure, i) => {
      const nextMeasure = measures[i + 1]

      const ticksPerBeat = (timebase * 4) / measure.denominator

      // 次の小節か曲の endTick まで拍を作る
      // Make a beat up to the next bar or song EndTick
      const lastTick = nextMeasure ? nextMeasure.tick : tickRange[1]

      const startBeat = Math.max(
        0,
        Math.floor((tickRange[0] - measure.tick) / ticksPerBeat)
      )
      const endBeat = (lastTick - measure.tick) / ticksPerBeat

      for (let beat = startBeat; beat < endBeat; beat++) {
        const tick = measure.tick + ticksPerBeat * beat
        beats.push({
          measure: measure.measure + Math.floor(beat / measure.numerator),
          beat: beat % measure.numerator,
          tick,
        })
      }
    })

    return beats
  }
}
