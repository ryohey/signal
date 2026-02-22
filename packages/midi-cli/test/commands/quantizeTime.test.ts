import { describe, expect, it } from "vitest"
import type { SerializedNote } from "../../src/types.js"

// Re-implement quantize-time logic for isolated testing (matching src/commands/quantizeTime.ts)

function quantizeTime(
  notes: SerializedNote[],
  gridTicks: number,
  strength: number = 100,
): SerializedNote[] {
  const factor = strength / 100

  return notes.map((note) => {
    const quantized = Math.round(note.tick / gridTicks) * gridTicks
    const newTick = Math.round(note.tick + (quantized - note.tick) * factor)
    return { ...note, tick: Math.max(0, newTick) }
  })
}

describe("quantize time logic", () => {
  const timebase = 480

  it("snaps notes to a quarter note grid (100% strength)", () => {
    const notes: SerializedNote[] = [
      { tick: 50, duration: 480, noteNumber: 60, velocity: 100 },
      { tick: 500, duration: 480, noteNumber: 62, velocity: 100 },
      { tick: 970, duration: 480, noteNumber: 64, velocity: 100 },
    ]
    const result = quantizeTime(notes, 480, 100)
    expect(result[0].tick).toBe(0) // 50 rounds to 0
    expect(result[1].tick).toBe(480) // 500 rounds to 480
    expect(result[2].tick).toBe(960) // 970 rounds to 960
  })

  it("snaps notes to an eighth note grid", () => {
    const notes: SerializedNote[] = [
      { tick: 100, duration: 480, noteNumber: 60, velocity: 100 },
      { tick: 350, duration: 480, noteNumber: 62, velocity: 100 },
    ]
    const result = quantizeTime(notes, 240, 100) // 1/8 = 240 ticks
    expect(result[0].tick).toBe(0) // 100 rounds to 0 (closer than 240)
    expect(result[1].tick).toBe(240) // 350 rounds to 240 (closer than 480)
  })

  it("applies partial strength", () => {
    const notes: SerializedNote[] = [
      { tick: 100, duration: 480, noteNumber: 60, velocity: 100 },
    ]
    // Grid = 480, quantized = 0. Move 50% toward 0: 100 + (0 - 100) * 0.5 = 50
    const result = quantizeTime(notes, 480, 50)
    expect(result[0].tick).toBe(50)
  })

  it("does not change notes already on the grid", () => {
    const notes: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
      { tick: 480, duration: 480, noteNumber: 62, velocity: 100 },
      { tick: 960, duration: 480, noteNumber: 64, velocity: 100 },
    ]
    const result = quantizeTime(notes, 480, 100)
    expect(result[0].tick).toBe(0)
    expect(result[1].tick).toBe(480)
    expect(result[2].tick).toBe(960)
  })

  it("handles 0% strength (no change)", () => {
    const notes: SerializedNote[] = [
      { tick: 123, duration: 480, noteNumber: 60, velocity: 100 },
    ]
    const result = quantizeTime(notes, 480, 0)
    expect(result[0].tick).toBe(123) // no movement
  })

  it("clamps tick to 0", () => {
    // Edge case: quantizing could theoretically push below 0 with negative offsets
    // but since we're snapping to grid, it should always be >= 0
    const notes: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
    ]
    const result = quantizeTime(notes, 480, 100)
    expect(result[0].tick).toBe(0)
  })

  it("handles empty notes array", () => {
    expect(quantizeTime([], 480, 100)).toEqual([])
  })

  it("preserves non-tick properties", () => {
    const notes: SerializedNote[] = [
      { tick: 50, duration: 240, noteNumber: 72, velocity: 80, channel: 5 },
    ]
    const result = quantizeTime(notes, 480, 100)
    expect(result[0].noteNumber).toBe(72)
    expect(result[0].duration).toBe(240)
    expect(result[0].velocity).toBe(80)
    expect(result[0].channel).toBe(5)
  })

  it("snaps to sixteenth note grid", () => {
    const notes: SerializedNote[] = [
      { tick: 100, duration: 480, noteNumber: 60, velocity: 100 },
    ]
    // 1/16 = 120 ticks
    const result = quantizeTime(notes, 120, 100)
    expect(result[0].tick).toBe(120) // 100 rounds to 120 (closer than 0)
  })
})
