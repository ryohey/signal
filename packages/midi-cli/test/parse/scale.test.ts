import { describe, expect, it } from "vitest"
import { parseScale } from "../../src/parse/scale.js"

describe("parseScale", () => {
  it("parses c-major", () => {
    const result = parseScale("c-major")
    expect(result.key).toBe(0)
    expect(result.scale).toBe("major")
    expect(result.intervals).toEqual([0, 2, 4, 5, 7, 9, 11])
  })

  it("parses d-major (transposed)", () => {
    const result = parseScale("d-major")
    expect(result.key).toBe(2)
    expect(result.scale).toBe("major")
    // D major = D E F# G A B C# = [2, 4, 6, 7, 9, 11, 1]
    expect(result.intervals).toEqual([2, 4, 6, 7, 9, 11, 1])
  })

  it("parses eb-dorian", () => {
    const result = parseScale("eb-dorian")
    expect(result.key).toBe(3)
    expect(result.scale).toBe("dorian")
  })

  it("parses c-minor", () => {
    const result = parseScale("c-minor")
    expect(result.key).toBe(0)
    expect(result.scale).toBe("minor")
    expect(result.intervals).toEqual([0, 2, 3, 5, 7, 8, 10])
  })

  it("parses bare scale name (defaults to C)", () => {
    const result = parseScale("major")
    expect(result.key).toBe(0)
    expect(result.scale).toBe("major")
  })

  it("handles f#-minor", () => {
    const result = parseScale("f#-minor")
    expect(result.key).toBe(6)
    expect(result.scale).toBe("minor")
  })

  it("handles bb-lydian", () => {
    const result = parseScale("bb-lydian")
    expect(result.key).toBe(10)
    expect(result.scale).toBe("lydian")
  })

  it("is case insensitive", () => {
    const result = parseScale("D-Major")
    expect(result.key).toBe(2)
    expect(result.scale).toBe("major")
  })

  it("throws on invalid key", () => {
    expect(() => parseScale("x-major")).toThrow("Invalid key")
  })

  it("throws on invalid scale", () => {
    expect(() => parseScale("c-invalid")).toThrow("Invalid scale type")
  })

  it("parses hyphenated scale names via alias", () => {
    // "c-whole-half-diminished" → key "c", scaleStr "whole-half-diminished"
    // resolveScale strips hyphens → "wholehalfdiminished" → alias lookup
    const result = parseScale("c-whole-half-diminished")
    expect(result.scale).toBe("wholeHalfDiminished")
    expect(result.key).toBe(0)
  })

  it("parses compound scale names like harmonicMinor", () => {
    const result = parseScale("c-harmonicMinor")
    expect(result.scale).toBe("harmonicMinor")
    expect(result.intervals).toEqual([0, 2, 3, 5, 7, 8, 11])
  })

  it("parses compound scale names via alias with hyphens", () => {
    const result = parseScale("c-harmonic-minor")
    expect(result.scale).toBe("harmonicMinor")
  })

  it("parses pentatonic scales", () => {
    const result = parseScale("c-majorPentatonic")
    expect(result.scale).toBe("majorPentatonic")
    expect(result.intervals).toHaveLength(5)
  })
})
