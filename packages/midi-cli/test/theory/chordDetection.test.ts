import { describe, expect, it } from "vitest"
import {
  detectBestChord,
  detectChord,
  formatChord,
} from "../../src/theory/chordDetection.js"

describe("detectChord", () => {
  it("detects C major triad [0, 4, 7]", () => {
    const results = detectChord([0, 4, 7])
    expect(results.length).toBeGreaterThan(0)
    const best = results[0]
    expect(best.root).toBe(0)
    expect(best.type).toBe("maj")
    expect(best.inversion).toBe(0)
  })

  it("detects D minor triad [2, 5, 9]", () => {
    const results = detectChord([2, 5, 9])
    const best = results[0]
    expect(best.root).toBe(2)
    expect(best.type).toBe("min")
  })

  it("detects G dominant 7 [7, 11, 2, 5]", () => {
    const results = detectChord([7, 11, 2, 5])
    const best = results[0]
    expect(best.root).toBe(7)
    expect(best.type).toBe("7")
  })

  it("detects first inversion C major [4, 7, 0]", () => {
    const results = detectChord([4, 0, 7])
    const cmaj = results.find((r) => r.root === 0 && r.type === "maj")
    expect(cmaj).toBeDefined()
  })

  it("detects diminished triad", () => {
    // B dim = [11, 2, 5]
    const results = detectChord([11, 2, 5])
    const dim = results.find((r) => r.root === 11 && r.type === "dim")
    expect(dim).toBeDefined()
  })

  it("detects augmented triad", () => {
    // C aug = [0, 4, 8]
    const results = detectChord([0, 4, 8])
    const aug = results.find((r) => r.type === "aug")
    expect(aug).toBeDefined()
  })

  it("returns empty for single note", () => {
    expect(detectChord([0])).toEqual([])
  })

  it("detects power chord [0, 7]", () => {
    const results = detectChord([0, 7])
    const power = results.find((r) => r.root === 0 && r.type === "5")
    expect(power).toBeDefined()
  })
})

describe("detectBestChord", () => {
  it("returns best match for C major", () => {
    const best = detectBestChord([0, 4, 7])
    expect(best).not.toBeNull()
    expect(best?.root).toBe(0)
    expect(best?.type).toBe("maj")
  })

  it("returns null for single note", () => {
    expect(detectBestChord([60])).toBeNull()
  })
})

describe("formatChord", () => {
  it("formats C major", () => {
    expect(
      formatChord({ root: 0, type: "maj", inversion: 0, score: 100 }),
    ).toBe("C")
  })

  it("formats Dm", () => {
    expect(
      formatChord({ root: 2, type: "min", inversion: 0, score: 100 }),
    ).toBe("Dmin")
  })

  it("formats with inversion", () => {
    expect(formatChord({ root: 0, type: "maj", inversion: 1, score: 90 })).toBe(
      "C (inv 1)",
    )
  })

  it("formats Bbmaj7", () => {
    expect(
      formatChord({ root: 10, type: "maj7", inversion: 0, score: 100 }),
    ).toBe("A#maj7")
  })
})
