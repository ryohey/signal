import type { SerializedMeasure } from "../types.js"

/**
 * Parse a position string into an absolute tick value.
 *
 * Supported formats:
 *   m3       → start of measure 3 (1-indexed)
 *   m1-2     → measure 1, beat 2 (1-indexed)
 *   m1-2-120 → measure 1, beat 2, +120 subticks
 *   t960     → raw tick 960
 *   start    → tick 0
 *   end      → end of last known measure region
 */
export function parsePosition(
  input: string,
  timebase: number,
  measures: SerializedMeasure[],
): number {
  const s = input.trim().toLowerCase()

  if (s === "start") {
    return 0
  }

  if (s === "end") {
    return getEndTick(timebase, measures)
  }

  // Raw tick: t960
  const tickMatch = s.match(/^t(\d+)$/)
  if (tickMatch) {
    return parseInt(tickMatch[1], 10)
  }

  // Measure-beat-tick: m3, m1-2, m1-2-120
  const mbtMatch = s.match(/^m(\d+)(?:-(\d+))?(?:-(\d+))?$/)
  if (mbtMatch) {
    const measureNum = parseInt(mbtMatch[1], 10) // 1-indexed
    const beatNum = mbtMatch[2] ? parseInt(mbtMatch[2], 10) : 1 // 1-indexed, default 1
    const subTick = mbtMatch[3] ? parseInt(mbtMatch[3], 10) : 0

    return mbtToTick(measureNum, beatNum, subTick, timebase, measures)
  }

  throw new Error(
    `Invalid position format: "${input}". ` +
      `Expected: m<measure>[-<beat>[-<tick>]], t<tick>, start, or end`,
  )
}

/**
 * Convert 1-indexed measure, beat, subtick to absolute tick.
 */
function mbtToTick(
  measureNum: number,
  beatNum: number,
  subTick: number,
  timebase: number,
  measures: SerializedMeasure[],
): number {
  // Find the measure definition that covers the requested measure number
  // measures are 0-indexed internally, user input is 1-indexed
  const targetMeasure = measureNum - 1
  const targetBeat = beatNum - 1

  const measureDef = getMeasureAt(targetMeasure, measures)

  const ticksPerBeat = (timebase * 4) / measureDef.denominator
  const ticksPerMeasure = ticksPerBeat * measureDef.numerator

  // How many measures past the measure definition's start
  const deltaMeasures = targetMeasure - measureDef.measure
  const baseTick = measureDef.tick + deltaMeasures * ticksPerMeasure

  return baseTick + targetBeat * ticksPerBeat + subTick
}

/**
 * Find the measure definition that covers the given 0-indexed measure number.
 */
function getMeasureAt(
  measureIndex: number,
  measures: SerializedMeasure[],
): SerializedMeasure {
  const defaultMeasure: SerializedMeasure = {
    tick: 0,
    measure: 0,
    numerator: 4,
    denominator: 4,
  }

  if (measures.length === 0) {
    return defaultMeasure
  }

  let result = measures[0]
  for (const m of measures) {
    if (m.measure <= measureIndex) {
      result = m
    } else {
      break
    }
  }
  return result
}

/**
 * Get the tick at the "end" of the song based on known measures.
 */
function getEndTick(timebase: number, measures: SerializedMeasure[]): number {
  if (measures.length === 0) {
    return 0
  }
  const last = measures[measures.length - 1]
  // Return a reasonable "end" — the start of the last measure definition
  // plus some measures. Since we don't know actual song length from measures alone,
  // return a large value. Callers typically use this as an upper bound for filtering.
  const ticksPerBeat = (timebase * 4) / last.denominator
  const ticksPerMeasure = ticksPerBeat * last.numerator
  return last.tick + ticksPerMeasure * 1000 // generous upper bound
}
