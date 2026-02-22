import { describe, expect, it } from "vitest"
import type { SerializedNote } from "../../src/types.js"

describe("filter logic", () => {
  const notes: SerializedNote[] = [
    { tick: 0, duration: 480, noteNumber: 60, velocity: 80 },
    { tick: 480, duration: 480, noteNumber: 72, velocity: 100 },
    { tick: 960, duration: 480, noteNumber: 48, velocity: 40 },
    { tick: 1440, duration: 480, noteNumber: 65, velocity: 120 },
  ]

  it("filters by tick range", () => {
    const filtered = notes.filter((n) => n.tick >= 480 && n.tick < 1440)
    expect(filtered).toHaveLength(2)
    expect(filtered[0].noteNumber).toBe(72)
    expect(filtered[1].noteNumber).toBe(48)
  })

  it("filters by pitch range", () => {
    const filtered = notes.filter(
      (n) => n.noteNumber >= 60 && n.noteNumber <= 72,
    )
    expect(filtered).toHaveLength(3)
  })

  it("filters by velocity range", () => {
    const filtered = notes.filter((n) => n.velocity >= 80 && n.velocity <= 120)
    expect(filtered).toHaveLength(3)
  })

  it("invert: keeps notes that don't match", () => {
    const match = (n: SerializedNote) =>
      n.noteNumber >= 60 && n.noteNumber <= 72
    const filtered = notes.filter((n) => !match(n))
    expect(filtered).toHaveLength(1)
    expect(filtered[0].noteNumber).toBe(48)
  })

  it("combines multiple filters", () => {
    const filtered = notes.filter(
      (n) => n.tick >= 0 && n.tick < 960 && n.velocity >= 90,
    )
    expect(filtered).toHaveLength(1)
    expect(filtered[0].noteNumber).toBe(72)
  })
})
