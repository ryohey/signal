import { describe, expect, it } from "vitest"
import type { SerializedNote } from "../../src/types.js"

// Re-implement invert logic for isolated testing (matching src/commands/invert.ts)

function invertNotes(notes: SerializedNote[], axis?: number): SerializedNote[] {
  if (notes.length === 0) return notes

  let effectiveAxis: number
  if (axis !== undefined) {
    effectiveAxis = axis
  } else {
    const min = Math.min(...notes.map((n) => n.noteNumber))
    const max = Math.max(...notes.map((n) => n.noteNumber))
    effectiveAxis = Math.round((min + max) / 2)
  }

  return notes.map((note) => ({
    ...note,
    noteNumber: Math.max(0, Math.min(127, 2 * effectiveAxis - note.noteNumber)),
  }))
}

describe("invert logic", () => {
  it("mirrors notes around a given axis", () => {
    const notes: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
      { tick: 480, duration: 480, noteNumber: 64, velocity: 100 },
    ]
    // Axis 62: note 60 → 64, note 64 → 60
    const result = invertNotes(notes, 62)
    expect(result[0].noteNumber).toBe(64)
    expect(result[1].noteNumber).toBe(60)
  })

  it("uses midpoint as default axis", () => {
    const notes: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
      { tick: 480, duration: 480, noteNumber: 72, velocity: 100 },
    ]
    // Default axis = round((60 + 72) / 2) = 66
    // 60 → 2*66 - 60 = 72, 72 → 2*66 - 72 = 60
    const result = invertNotes(notes)
    expect(result[0].noteNumber).toBe(72)
    expect(result[1].noteNumber).toBe(60)
  })

  it("keeps notes at the axis unchanged", () => {
    const notes: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
    ]
    const result = invertNotes(notes, 60)
    expect(result[0].noteNumber).toBe(60)
  })

  it("clamps to 0 when inversion goes below range", () => {
    const notes: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 120, velocity: 100 },
    ]
    // Axis 10: 2*10 - 120 = -100 → clamps to 0
    const result = invertNotes(notes, 10)
    expect(result[0].noteNumber).toBe(0)
  })

  it("clamps to 127 when inversion goes above range", () => {
    const notes: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 10, velocity: 100 },
    ]
    // Axis 120: 2*120 - 10 = 230 → clamps to 127
    const result = invertNotes(notes, 120)
    expect(result[0].noteNumber).toBe(127)
  })

  it("handles empty notes array", () => {
    expect(invertNotes([])).toEqual([])
  })

  it("handles single note with auto-axis", () => {
    const notes: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
    ]
    // axis = round((60+60)/2) = 60 → 2*60 - 60 = 60
    const result = invertNotes(notes)
    expect(result[0].noteNumber).toBe(60)
  })

  it("preserves non-pitch properties", () => {
    const notes: SerializedNote[] = [
      { tick: 100, duration: 200, noteNumber: 60, velocity: 80, channel: 3 },
    ]
    const result = invertNotes(notes, 60)
    expect(result[0].tick).toBe(100)
    expect(result[0].duration).toBe(200)
    expect(result[0].velocity).toBe(80)
    expect(result[0].channel).toBe(3)
  })
})
