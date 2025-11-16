import { Beat } from "../beat/Beat"
import { Range } from "../geometry/Range"

interface TimeSignature {
  readonly tick: number
  readonly numerator: number
  readonly denominator: number
}

export interface Measure extends TimeSignature {
  measure: number
}

export namespace Measure {
  const defaultValue: Measure = {
    tick: 0,
    measure: 0,
    denominator: 4,
    numerator: 4,
  }

  const calculateMBT = (
    measure: Measure,
    tick: number,
    ticksPerBeatBase: number,
  ) => {
    const ticksPerBeat = (ticksPerBeatBase * 4) / measure.denominator
    const ticksPerMeasure = ticksPerBeat * measure.numerator

    let aTick = tick - measure.tick

    const deltaMeasure = Math.floor(aTick / ticksPerMeasure)
    aTick -= deltaMeasure * ticksPerMeasure

    const beat = Math.floor(aTick / ticksPerBeat)
    aTick -= beat * ticksPerBeat

    return {
      measure: measure.measure + deltaMeasure,
      beat: beat,
      tick: aTick,
    }
  }

  export function fromTimeSignatures(
    events: TimeSignature[],
    timebase: number,
  ): Measure[] {
    if (events.length === 0) {
      return [defaultValue]
    } else {
      let lastMeasure = 0
      return events.map((e, i) => {
        let measure = 0
        if (i > 0) {
          const lastEvent = events[i - 1]
          const ticksPerBeat = (timebase * 4) / lastEvent.denominator
          const measureDelta = Math.floor(
            (e.tick - lastEvent.tick) / ticksPerBeat / lastEvent.numerator,
          )
          measure = lastMeasure + measureDelta
          lastMeasure = measure
        }
        return {
          tick: e.tick,
          measure,
          numerator: e.numerator,
          denominator: e.denominator,
        }
      })
    }
  }

  export const getMBTString = (
    measures: Measure[],
    tick: number,
    ticksPerBeat: number,
    formatter = defaultMBTFormatter,
  ): string => formatter(getMBT(measures, tick, ticksPerBeat))

  // Find the measure in the range. The first element also includes those before startTick
  export const getMeasuresInRange = (measures: Measure[], tickRange: Range) => {
    let i = 0
    const result: Measure[] = []

    for (const measure of measures) {
      const nextMeasure = measures[i + 1]
      i++

      // Find the first measure
      if (result.length === 0) {
        if (nextMeasure !== undefined && nextMeasure.tick <= tickRange[0]) {
          // Skip if the next Measure can be the first
          continue
        }
        if (measure.tick > tickRange[0]) {
          console.warn("There is no initial time signature. Use 4/4 by default")
          result.push(defaultValue)
        } else {
          result.push(measure)
        }
      }

      // Find the remaining measures. Check if there is another first measure again to handle the case where there is no first measure correctly.
      if (result.length !== 0) {
        if (measure.tick <= tickRange[1]) {
          result.push(measure)
        } else {
          break
        }
      }
    }

    return result
  }

  const getMBT = (
    measures: Measure[],
    tick: number,
    ticksPerBeat: number,
  ): Beat => {
    return calculateMBT(
      getLastSorted(measures, tick) ?? defaultValue,
      tick,
      ticksPerBeat,
    )
  }

  export function getMeasureStart(
    measures: Measure[],
    tick: number,
    timebase: number,
  ) {
    const e = getLastSorted(measures, tick) ?? defaultValue

    // calculate the nearest measure beginning
    const ticksPerMeasure = ((timebase * 4) / e.denominator) * e.numerator
    const numberOfMeasures = Math.floor((tick - e.tick) / ticksPerMeasure)
    const beginMeasureTick = e.tick + ticksPerMeasure * numberOfMeasures

    const ticksPerBeat = (timebase * 4) / e.denominator

    return {
      tick: beginMeasureTick,
      duration: ticksPerMeasure,
      ticksPerBeat,
      eventTick: e.tick,
      numerator: e.numerator,
    }
  }

  /**
   * Returns the tick one measure before the specified tick
   *
   * If the tick is already at the beginning of a measure, it returns the tick of the previous measure
   *
   * To prevent the inability to rewind during playback,
   * if the position has not advanced more than 1 beat from the beginning of the measure,
   * rewind further to the previous measure
   */
  export function getPreviousMeasureTick(
    measures: Measure[],
    position: number,
    timebase: number,
  ): number {
    const measureStart = getMeasureStart(measures, position, timebase)

    if (position > measureStart.tick + measureStart.ticksPerBeat) {
      return measureStart.tick
    }

    // previous measure
    return getMeasureStart(measures, measureStart.tick - 1, timebase).tick
  }

  export function getNextMeasureTick(
    measures: Measure[],
    position: number,
    timebase: number,
  ): number {
    const measureStart = getMeasureStart(measures, position, timebase)
    return measureStart.tick + measureStart.duration
  }
}

const pad = (v: number, digit: number) => {
  const str = v.toFixed(0)
  return ("0".repeat(digit) + str).slice(-Math.max(digit, str.length))
}

function defaultMBTFormatter(mbt: Beat): string {
  return `${pad(mbt.measure + 1, 4)}:${pad(mbt.beat + 1, 2)}:${pad(
    mbt.tick,
    3,
  )}`
}

function getLastSorted<T extends { tick: number }>(
  events: T[],
  tick: number,
): T | null {
  let lastMeasure: T | null = null
  for (const m of events) {
    if (m.tick > tick) {
      break
    }
    lastMeasure = m
  }
  return lastMeasure
}
