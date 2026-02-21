import { describe, it, expect } from "vitest"
import { Scale } from "../../src/theory/Scale.js"

describe("Scale", () => {
  describe("values", () => {
    it("contains 19 scale types", () => {
      expect(Scale.values).toHaveLength(19)
    })

    it("includes major and minor", () => {
      expect(Scale.values).toContain("major")
      expect(Scale.values).toContain("minor")
    })

    it("includes all 7 modes", () => {
      const modes = [
        "ionian",
        "dorian",
        "phrygian",
        "lydian",
        "mixolydian",
        "aeolian",
        "locrian",
      ]
      for (const mode of modes) {
        expect(Scale.values).toContain(mode)
      }
    })
  })

  describe("getIntegerNotation", () => {
    it("returns correct intervals for major scale", () => {
      expect(Scale.getIntegerNotation("major")).toEqual([0, 2, 4, 5, 7, 9, 11])
    })

    it("returns correct intervals for minor scale", () => {
      expect(Scale.getIntegerNotation("minor")).toEqual([0, 2, 3, 5, 7, 8, 10])
    })

    it("ionian equals major", () => {
      expect(Scale.getIntegerNotation("ionian")).toEqual(
        Scale.getIntegerNotation("major"),
      )
    })

    it("aeolian equals minor", () => {
      expect(Scale.getIntegerNotation("aeolian")).toEqual(
        Scale.getIntegerNotation("minor"),
      )
    })

    it("returns correct intervals for harmonic minor", () => {
      expect(Scale.getIntegerNotation("harmonicMinor")).toEqual([
        0, 2, 3, 5, 7, 8, 11,
      ])
    })

    it("returns correct intervals for melodic minor", () => {
      expect(Scale.getIntegerNotation("melodicMinor")).toEqual([
        0, 2, 3, 5, 7, 9, 11,
      ])
    })

    it("returns correct intervals for dorian", () => {
      expect(Scale.getIntegerNotation("dorian")).toEqual([
        0, 2, 3, 5, 7, 9, 10,
      ])
    })

    it("returns correct intervals for pentatonic scales", () => {
      expect(Scale.getIntegerNotation("majorPentatonic")).toEqual([
        0, 2, 4, 7, 9,
      ])
      expect(Scale.getIntegerNotation("minorPentatonic")).toEqual([
        0, 3, 5, 7, 10,
      ])
    })

    it("returns correct intervals for blues scales", () => {
      expect(Scale.getIntegerNotation("majorBlues")).toEqual([
        0, 2, 3, 4, 7, 9,
      ])
      expect(Scale.getIntegerNotation("minorBlues")).toEqual([
        0, 3, 5, 6, 7, 10,
      ])
    })

    it("returns correct intervals for whole tone scale", () => {
      expect(Scale.getIntegerNotation("wholeTone")).toEqual([
        0, 2, 4, 6, 8, 10,
      ])
    })

    it("returns correct intervals for diminished scales", () => {
      // Half-whole: alternating half and whole steps
      expect(Scale.getIntegerNotation("halfWholeDiminished")).toEqual([
        0, 1, 3, 4, 6, 7, 9, 10,
      ])
      // Whole-half: alternating whole and half steps
      expect(Scale.getIntegerNotation("wholeHalfDiminished")).toEqual([
        0, 2, 3, 5, 6, 8, 9, 11,
      ])
    })

    it("all scales return only values 0-11", () => {
      for (const scale of Scale.values) {
        const intervals = Scale.getIntegerNotation(scale)
        for (const interval of intervals) {
          expect(interval).toBeGreaterThanOrEqual(0)
          expect(interval).toBeLessThanOrEqual(11)
        }
      }
    })

    it("all scales start with 0 (root)", () => {
      for (const scale of Scale.values) {
        const intervals = Scale.getIntegerNotation(scale)
        expect(intervals[0]).toBe(0)
      }
    })

    it("all scales have unique pitch classes", () => {
      for (const scale of Scale.values) {
        const intervals = Scale.getIntegerNotation(scale)
        const unique = new Set(intervals)
        expect(unique.size).toBe(intervals.length)
      }
    })
  })
})
