import { describe, it, expect } from "vitest"
import { KeySignature } from "../../src/theory/KeySignature.js"

describe("KeySignature", () => {
  it("returns C major intervals (no transposition needed)", () => {
    const intervals = KeySignature.getIntervals({ key: 0, scale: "major" })
    expect(intervals).toEqual([0, 2, 4, 5, 7, 9, 11])
  })

  it("returns D major intervals (transposed by 2)", () => {
    const intervals = KeySignature.getIntervals({ key: 2, scale: "major" })
    // D major = D E F# G A B C# = [2, 4, 6, 7, 9, 11, 1]
    expect(intervals).toEqual([2, 4, 6, 7, 9, 11, 1])
  })

  it("returns C minor intervals", () => {
    const intervals = KeySignature.getIntervals({ key: 0, scale: "minor" })
    expect(intervals).toEqual([0, 2, 3, 5, 7, 8, 10])
  })

  it("returns A minor intervals (relative minor of C)", () => {
    const intervals = KeySignature.getIntervals({ key: 9, scale: "minor" })
    // A minor = A B C D E F G = [9, 11, 0, 2, 4, 5, 7]
    expect(intervals).toEqual([9, 11, 0, 2, 4, 5, 7])
  })

  it("returns Eb major intervals", () => {
    const intervals = KeySignature.getIntervals({ key: 3, scale: "major" })
    // Eb major = Eb F G Ab Bb C D = [3, 5, 7, 8, 10, 0, 2]
    expect(intervals).toEqual([3, 5, 7, 8, 10, 0, 2])
  })

  it("wraps intervals around at 12", () => {
    // All intervals should be 0-11
    for (let key = 0; key < 12; key++) {
      const intervals = KeySignature.getIntervals({ key, scale: "major" })
      for (const interval of intervals) {
        expect(interval).toBeGreaterThanOrEqual(0)
        expect(interval).toBeLessThanOrEqual(11)
      }
    }
  })

  it("returns correct number of intervals for pentatonic", () => {
    const intervals = KeySignature.getIntervals({
      key: 0,
      scale: "majorPentatonic",
    })
    expect(intervals).toHaveLength(5)
    expect(intervals).toEqual([0, 2, 4, 7, 9])
  })

  it("returns 8 intervals for diminished scales", () => {
    const intervals = KeySignature.getIntervals({
      key: 0,
      scale: "halfWholeDiminished",
    })
    expect(intervals).toHaveLength(8)
  })
})
