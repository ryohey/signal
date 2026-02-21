import { describe, it, expect } from "vitest"
import type { SerializedNote } from "../../src/types.js"

// Re-implement retrograde logic for isolated testing (matching src/commands/retrograde.ts)

function retrograde(notes: SerializedNote[]): SerializedNote[] {
  if (notes.length <= 1) return [...notes]

  const sorted = [...notes].sort((a, b) => a.tick - b.tick)
  const firstTick = sorted[0].tick
  const lastTick = sorted[sorted.length - 1].tick

  const result = notes.map((note) => ({
    ...note,
    tick: firstTick + (lastTick - note.tick),
  }))

  result.sort((a, b) => a.tick - b.tick)
  return result
}

describe("retrograde logic", () => {
  it("reverses note timing", () => {
    const notes: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
      { tick: 480, duration: 480, noteNumber: 64, velocity: 100 },
      { tick: 960, duration: 480, noteNumber: 67, velocity: 100 },
    ]
    const result = retrograde(notes)
    // First → last: 0 → 0 + (960 - 0) = 960
    // Middle stays: 0 + (960 - 480) = 480
    // Last → first: 0 + (960 - 960) = 0
    expect(result[0].noteNumber).toBe(67) // was at 960, now at 0
    expect(result[1].noteNumber).toBe(64) // was at 480, stays at 480
    expect(result[2].noteNumber).toBe(60) // was at 0, now at 960
  })

  it("preserves tick boundaries", () => {
    const notes: SerializedNote[] = [
      { tick: 100, duration: 480, noteNumber: 60, velocity: 100 },
      { tick: 500, duration: 480, noteNumber: 62, velocity: 100 },
    ]
    const result = retrograde(notes)
    // firstTick=100, lastTick=500
    // 100 → 100 + (500 - 100) = 500
    // 500 → 100 + (500 - 500) = 100
    expect(result[0].tick).toBe(100)
    expect(result[0].noteNumber).toBe(62)
    expect(result[1].tick).toBe(500)
    expect(result[1].noteNumber).toBe(60)
  })

  it("returns empty array for empty input", () => {
    expect(retrograde([])).toEqual([])
  })

  it("returns same note for single note", () => {
    const notes: SerializedNote[] = [
      { tick: 480, duration: 240, noteNumber: 60, velocity: 100 },
    ]
    const result = retrograde(notes)
    expect(result).toHaveLength(1)
    expect(result[0].tick).toBe(480)
    expect(result[0].noteNumber).toBe(60)
  })

  it("sorts output by tick", () => {
    const notes: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
      { tick: 480, duration: 480, noteNumber: 62, velocity: 100 },
      { tick: 960, duration: 480, noteNumber: 64, velocity: 100 },
      { tick: 1440, duration: 480, noteNumber: 65, velocity: 100 },
    ]
    const result = retrograde(notes)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].tick).toBeGreaterThanOrEqual(result[i - 1].tick)
    }
  })

  it("preserves durations and velocities", () => {
    const notes: SerializedNote[] = [
      { tick: 0, duration: 100, noteNumber: 60, velocity: 40 },
      { tick: 960, duration: 200, noteNumber: 72, velocity: 120 },
    ]
    const result = retrograde(notes)
    // Note at tick 0 moves to 960, note at 960 moves to 0
    const noteAtZero = result.find((n) => n.tick === 0)!
    const noteAt960 = result.find((n) => n.tick === 960)!
    expect(noteAtZero.duration).toBe(200)
    expect(noteAtZero.velocity).toBe(120)
    expect(noteAt960.duration).toBe(100)
    expect(noteAt960.velocity).toBe(40)
  })

  it("handles notes at the same tick", () => {
    const notes: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
      { tick: 0, duration: 480, noteNumber: 64, velocity: 100 },
      { tick: 960, duration: 480, noteNumber: 67, velocity: 100 },
    ]
    const result = retrograde(notes)
    // Notes at tick 0 → tick 960, note at tick 960 → tick 0
    expect(result.filter((n) => n.tick === 960)).toHaveLength(2)
    expect(result.filter((n) => n.tick === 0)).toHaveLength(1)
  })
})
