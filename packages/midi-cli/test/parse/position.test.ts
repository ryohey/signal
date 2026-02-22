import { describe, expect, it } from "vitest"
import { parsePosition } from "../../src/parse/position.js"
import type { SerializedMeasure } from "../../src/types.js"

const timebase = 480 // ticks per quarter note

// Simple 4/4 starting at tick 0
const measures44: SerializedMeasure[] = [
  { tick: 0, measure: 0, numerator: 4, denominator: 4 },
]

// Mixed time signatures: 4/4 for first 2 measures, then 3/4
const mixedMeasures: SerializedMeasure[] = [
  { tick: 0, measure: 0, numerator: 4, denominator: 4 },
  { tick: 3840, measure: 2, numerator: 3, denominator: 4 },
]

describe("parsePosition", () => {
  it("parses 'start' as tick 0", () => {
    expect(parsePosition("start", timebase, measures44)).toBe(0)
  })

  it("parses raw tick format 't960'", () => {
    expect(parsePosition("t960", timebase, measures44)).toBe(960)
    expect(parsePosition("t0", timebase, measures44)).toBe(0)
  })

  it("parses measure-only format 'm1' (start of measure 1)", () => {
    // m1 = measure 1, beat 1 = tick 0
    expect(parsePosition("m1", timebase, measures44)).toBe(0)
  })

  it("parses 'm2' as start of measure 2", () => {
    // measure 2 in 4/4 at 480 timebase = 4 beats * 480 = 1920
    expect(parsePosition("m2", timebase, measures44)).toBe(1920)
  })

  it("parses measure-beat format 'm1-2'", () => {
    // measure 1, beat 2 = 1 beat = 480 ticks
    expect(parsePosition("m1-2", timebase, measures44)).toBe(480)
  })

  it("parses measure-beat-tick format 'm1-2-120'", () => {
    expect(parsePosition("m1-2-120", timebase, measures44)).toBe(480 + 120)
  })

  it("parses 'm3-1' as start of measure 3", () => {
    // 2 measures of 4/4 = 2 * 1920 = 3840
    expect(parsePosition("m3-1", timebase, measures44)).toBe(3840)
  })

  it("handles mixed time signatures", () => {
    // m3 starts at tick 3840 (2 measures of 4/4)
    expect(parsePosition("m3", timebase, mixedMeasures)).toBe(3840)
    // m3-2 = tick 3840 + 1 beat at 480 = 4320
    expect(parsePosition("m3-2", timebase, mixedMeasures)).toBe(4320)
  })

  it("is case insensitive", () => {
    expect(parsePosition("M1-2", timebase, measures44)).toBe(480)
    expect(parsePosition("START", timebase, measures44)).toBe(0)
    expect(parsePosition("T960", timebase, measures44)).toBe(960)
  })

  it("throws on invalid format", () => {
    expect(() => parsePosition("invalid", timebase, measures44)).toThrow()
    expect(() => parsePosition("x5", timebase, measures44)).toThrow()
  })
})
