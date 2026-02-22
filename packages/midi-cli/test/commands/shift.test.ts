import { describe, expect, it } from "vitest"
import type { SerializedNote } from "../../src/types.js"

// Re-implement shift logic for isolated testing (matching src/commands/shift.ts)

function parseShiftAmount(
  amount: string,
  timebase: number,
  measures: { numerator: number; denominator: number }[],
): number {
  const s = amount.trim()

  // Ticks: +120t, -120t, 120t
  const tickMatch = s.match(/^([+-]?\d+)t$/)
  if (tickMatch) {
    return parseInt(tickMatch[1], 10)
  }

  // Beats: +1b, -2b
  const beatMatch = s.match(/^([+-]?\d+)b$/)
  if (beatMatch) {
    const beats = parseInt(beatMatch[1], 10)
    const denom = measures.length > 0 ? measures[0].denominator : 4
    const ticksPerBeat = (timebase * 4) / denom
    return Math.round(beats * ticksPerBeat)
  }

  // Measures: +1m, -1m
  const measureMatch = s.match(/^([+-]?\d+)m$/)
  if (measureMatch) {
    const numMeasures = parseInt(measureMatch[1], 10)
    const m =
      measures.length > 0 ? measures[0] : { numerator: 4, denominator: 4 }
    const ticksPerBeat = (timebase * 4) / m.denominator
    const ticksPerMeasure = ticksPerBeat * m.numerator
    return Math.round(numMeasures * ticksPerMeasure)
  }

  // Plain number = ticks
  const plain = parseInt(s, 10)
  if (!Number.isNaN(plain)) {
    return plain
  }

  throw new Error(
    `Invalid shift amount: "${amount}". Expected: <n>t (ticks), <n>b (beats), <n>m (measures), or a plain number`,
  )
}

function shiftNotes(notes: SerializedNote[], delta: number): SerializedNote[] {
  return notes.map((note) => ({
    ...note,
    tick: Math.max(0, note.tick + delta),
  }))
}

const timebase = 480
const measures44 = [{ numerator: 4, denominator: 4 }]
const measures34 = [{ numerator: 3, denominator: 4 }]

describe("shift parseShiftAmount", () => {
  it("parses tick format: +120t", () => {
    expect(parseShiftAmount("+120t", timebase, measures44)).toBe(120)
  })

  it("parses negative tick format: -120t", () => {
    expect(parseShiftAmount("-120t", timebase, measures44)).toBe(-120)
  })

  it("parses unsigned tick format: 120t", () => {
    expect(parseShiftAmount("120t", timebase, measures44)).toBe(120)
  })

  it("parses beat format: +1b (4/4 time)", () => {
    // In 4/4, one beat = 480 ticks
    expect(parseShiftAmount("+1b", timebase, measures44)).toBe(480)
  })

  it("parses beat format: +2b", () => {
    expect(parseShiftAmount("+2b", timebase, measures44)).toBe(960)
  })

  it("parses negative beat format: -1b", () => {
    expect(parseShiftAmount("-1b", timebase, measures44)).toBe(-480)
  })

  it("parses measure format: +1m (4/4 time)", () => {
    // In 4/4, one measure = 4 beats * 480 = 1920 ticks
    expect(parseShiftAmount("+1m", timebase, measures44)).toBe(1920)
  })

  it("parses measure format: +2m", () => {
    expect(parseShiftAmount("+2m", timebase, measures44)).toBe(3840)
  })

  it("parses measure format: -1m", () => {
    expect(parseShiftAmount("-1m", timebase, measures44)).toBe(-1920)
  })

  it("handles 3/4 time for beats", () => {
    // In 3/4, one beat is still a quarter note = 480 ticks
    expect(parseShiftAmount("+1b", timebase, measures34)).toBe(480)
  })

  it("handles 3/4 time for measures", () => {
    // In 3/4, one measure = 3 beats * 480 = 1440 ticks
    expect(parseShiftAmount("+1m", timebase, measures34)).toBe(1440)
  })

  it("parses plain number as ticks", () => {
    expect(parseShiftAmount("240", timebase, measures44)).toBe(240)
  })

  it("parses negative plain number", () => {
    expect(parseShiftAmount("-240", timebase, measures44)).toBe(-240)
  })

  it("throws on invalid format", () => {
    expect(() => parseShiftAmount("invalid", timebase, measures44)).toThrow()
  })

  it("defaults to 4/4 when no measures provided", () => {
    expect(parseShiftAmount("+1m", timebase, [])).toBe(1920)
    expect(parseShiftAmount("+1b", timebase, [])).toBe(480)
  })
})

describe("shift notes", () => {
  const notes: SerializedNote[] = [
    { tick: 480, duration: 480, noteNumber: 60, velocity: 100 },
    { tick: 960, duration: 480, noteNumber: 62, velocity: 100 },
  ]

  it("shifts notes forward", () => {
    const result = shiftNotes(notes, 480)
    expect(result[0].tick).toBe(960)
    expect(result[1].tick).toBe(1440)
  })

  it("shifts notes backward", () => {
    const result = shiftNotes(notes, -240)
    expect(result[0].tick).toBe(240)
    expect(result[1].tick).toBe(720)
  })

  it("clamps to 0 when shifting below zero", () => {
    const result = shiftNotes(notes, -2000)
    expect(result[0].tick).toBe(0)
    expect(result[1].tick).toBe(0)
  })

  it("preserves other note properties", () => {
    const result = shiftNotes(notes, 100)
    expect(result[0].noteNumber).toBe(60)
    expect(result[0].velocity).toBe(100)
    expect(result[0].duration).toBe(480)
  })
})
