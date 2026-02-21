import { describe, it, expect } from "vitest"
import { parseNoteRange, parseVelocityRange } from "../../src/parse/noteRange.js"

describe("parseNoteRange", () => {
  it("parses numeric range '60-72'", () => {
    expect(parseNoteRange("60-72")).toEqual({ min: 60, max: 72 })
  })

  it("parses single MIDI number '60'", () => {
    expect(parseNoteRange("60")).toEqual({ min: 60, max: 60 })
  })

  it("parses note name 'C4' to MIDI 60", () => {
    expect(parseNoteRange("C4")).toEqual({ min: 60, max: 60 })
  })

  it("parses note name range 'C4-C5'", () => {
    expect(parseNoteRange("C4-C5")).toEqual({ min: 60, max: 72 })
  })

  it("parses sharps: C#4 = 61", () => {
    expect(parseNoteRange("C#4")).toEqual({ min: 61, max: 61 })
  })

  it("parses flats: Eb4 = 63", () => {
    expect(parseNoteRange("Eb4")).toEqual({ min: 63, max: 63 })
  })

  it("ensures min <= max even if reversed", () => {
    expect(parseNoteRange("72-60")).toEqual({ min: 60, max: 72 })
  })

  it("throws on out-of-range MIDI number", () => {
    expect(() => parseNoteRange("128")).toThrow()
  })
})

describe("parseVelocityRange", () => {
  it("parses velocity range '0-64'", () => {
    expect(parseVelocityRange("0-64")).toEqual({ min: 0, max: 64 })
  })

  it("parses single velocity '100'", () => {
    expect(parseVelocityRange("100")).toEqual({ min: 100, max: 100 })
  })

  it("clamps to valid range", () => {
    const result = parseVelocityRange("0-200")
    expect(result.max).toBe(127)
  })
})
