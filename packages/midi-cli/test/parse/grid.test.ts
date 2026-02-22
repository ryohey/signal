import { describe, expect, it } from "vitest"
import { parseGrid } from "../../src/parse/grid.js"

const timebase = 480

describe("parseGrid", () => {
  it("parses 1/4 as a quarter note", () => {
    expect(parseGrid("1/4", timebase)).toBe(480)
  })

  it("parses 1/8 as an eighth note", () => {
    expect(parseGrid("1/8", timebase)).toBe(240)
  })

  it("parses 1/16 as a sixteenth note", () => {
    expect(parseGrid("1/16", timebase)).toBe(120)
  })

  it("parses 1/32 as a thirty-second note", () => {
    expect(parseGrid("1/32", timebase)).toBe(60)
  })

  it("parses 1/2 as a half note", () => {
    expect(parseGrid("1/2", timebase)).toBe(960)
  })

  it("parses 1/4t as a quarter note triplet", () => {
    // Triplet = 2/3 of normal
    expect(parseGrid("1/4t", timebase)).toBe(320)
  })

  it("parses 1/8t as an eighth note triplet", () => {
    expect(parseGrid("1/8t", timebase)).toBe(160)
  })

  it("parses 1/4. as a dotted quarter note", () => {
    // Dotted = 1.5 * normal
    expect(parseGrid("1/4.", timebase)).toBe(720)
  })

  it("parses raw tick value", () => {
    expect(parseGrid("120", timebase)).toBe(120)
  })

  it("throws on invalid grid value", () => {
    expect(() => parseGrid("invalid", timebase)).toThrow()
  })
})
