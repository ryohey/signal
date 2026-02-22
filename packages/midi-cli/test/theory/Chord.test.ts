import { describe, expect, it } from "vitest"
import { Chord } from "../../src/theory/Chord.js"

describe("Chord", () => {
  describe("values", () => {
    it("contains 23 chord types", () => {
      expect(Chord.values).toHaveLength(23)
    })

    it("includes basic triads", () => {
      expect(Chord.values).toContain("maj")
      expect(Chord.values).toContain("min")
      expect(Chord.values).toContain("dim")
      expect(Chord.values).toContain("aug")
    })

    it("includes seventh chords", () => {
      expect(Chord.values).toContain("maj7")
      expect(Chord.values).toContain("7")
      expect(Chord.values).toContain("min7")
      expect(Chord.values).toContain("dim7")
    })
  })

  describe("getIntervals", () => {
    it("major triad = [0, 4, 7]", () => {
      expect(Chord.getIntervals("maj")).toEqual([0, 4, 7])
    })

    it("minor triad = [0, 3, 7]", () => {
      expect(Chord.getIntervals("min")).toEqual([0, 3, 7])
    })

    it("diminished = [0, 3, 6]", () => {
      expect(Chord.getIntervals("dim")).toEqual([0, 3, 6])
    })

    it("augmented = [0, 4, 8]", () => {
      expect(Chord.getIntervals("aug")).toEqual([0, 4, 8])
    })

    it("dominant 7 = [0, 4, 7, 10]", () => {
      expect(Chord.getIntervals("7")).toEqual([0, 4, 7, 10])
    })

    it("major 7 = [0, 4, 7, 11]", () => {
      expect(Chord.getIntervals("maj7")).toEqual([0, 4, 7, 11])
    })

    it("minor 7 = [0, 3, 7, 10]", () => {
      expect(Chord.getIntervals("min7")).toEqual([0, 3, 7, 10])
    })

    it("half-diminished = [0, 3, 6, 10]", () => {
      expect(Chord.getIntervals("m7b5")).toEqual([0, 3, 6, 10])
    })

    it("sus2 = [0, 2, 7]", () => {
      expect(Chord.getIntervals("sus2")).toEqual([0, 2, 7])
    })

    it("sus4 = [0, 5, 7]", () => {
      expect(Chord.getIntervals("sus4")).toEqual([0, 5, 7])
    })

    it("9th = [0, 4, 7, 10, 14]", () => {
      expect(Chord.getIntervals("9")).toEqual([0, 4, 7, 10, 14])
    })

    it("13th has 7 notes", () => {
      expect(Chord.getIntervals("13")).toHaveLength(7)
    })

    it("power chord = [0, 7]", () => {
      expect(Chord.getIntervals("5")).toEqual([0, 7])
    })

    it("all chords start with 0", () => {
      for (const chord of Chord.values) {
        expect(Chord.getIntervals(chord)[0]).toBe(0)
      }
    })

    it("all intervals are non-negative", () => {
      for (const chord of Chord.values) {
        for (const interval of Chord.getIntervals(chord)) {
          expect(interval).toBeGreaterThanOrEqual(0)
        }
      }
    })
  })

  describe("getPitchClasses", () => {
    it("C major = [0, 4, 7]", () => {
      expect(Chord.getPitchClasses(0, "maj")).toEqual([0, 4, 7])
    })

    it("D minor = [2, 5, 9]", () => {
      expect(Chord.getPitchClasses(2, "min")).toEqual([2, 5, 9])
    })

    it("G7 = [7, 11, 2, 5]", () => {
      expect(Chord.getPitchClasses(7, "7")).toEqual([7, 11, 2, 5])
    })

    it("wraps around 12", () => {
      const pcs = Chord.getPitchClasses(11, "maj")
      for (const pc of pcs) {
        expect(pc).toBeGreaterThanOrEqual(0)
        expect(pc).toBeLessThanOrEqual(11)
      }
    })
  })
})
