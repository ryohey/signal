import { describe, it, expect, vi } from "vitest"
import type { SerializedNote } from "../../src/types.js"

// Re-implement humanize logic for isolated testing (matching src/commands/humanize.ts)

function humanizeNotes(
  notes: SerializedNote[],
  maxTimeDelta: number,
  maxVelDelta: number,
): SerializedNote[] {
  return notes.map((note) => {
    let { tick, velocity } = note

    if (maxTimeDelta > 0) {
      const timeDelta = Math.round((Math.random() * 2 - 1) * maxTimeDelta)
      tick = Math.max(0, tick + timeDelta)
    }

    if (maxVelDelta > 0) {
      const velDelta = Math.round((Math.random() * 2 - 1) * maxVelDelta)
      velocity = Math.max(1, Math.min(127, velocity + velDelta))
    }

    return { ...note, tick, velocity }
  })
}

describe("humanize logic", () => {
  const notes: SerializedNote[] = [
    { tick: 480, duration: 480, noteNumber: 60, velocity: 80 },
    { tick: 960, duration: 480, noteNumber: 62, velocity: 100 },
    { tick: 1440, duration: 480, noteNumber: 64, velocity: 60 },
  ]

  it("does not modify notes when both deltas are 0", () => {
    const result = humanizeNotes(notes, 0, 0)
    expect(result).toEqual(notes)
  })

  it("keeps ticks >= 0 with time humanization", () => {
    // Use a mock that returns -1 (maximum negative) to force ticks toward 0
    vi.spyOn(Math, "random").mockReturnValue(0)
    const result = humanizeNotes(notes, 10000, 0)
    for (const note of result) {
      expect(note.tick).toBeGreaterThanOrEqual(0)
    }
    vi.restoreAllMocks()
  })

  it("keeps velocity in 1-127 range", () => {
    // Run many times with real randomness to verify bounds
    for (let i = 0; i < 20; i++) {
      const result = humanizeNotes(notes, 0, 127)
      for (const note of result) {
        expect(note.velocity).toBeGreaterThanOrEqual(1)
        expect(note.velocity).toBeLessThanOrEqual(127)
      }
    }
  })

  it("applies time deviation within bounds", () => {
    // Mock random to return 1 (maximum positive)
    vi.spyOn(Math, "random").mockReturnValue(1)
    const maxTime = 20
    const result = humanizeNotes(notes, maxTime, 0)
    // Math.random() = 1 → (1 * 2 - 1) * 20 = 20
    expect(result[0].tick).toBe(480 + 20)
    expect(result[1].tick).toBe(960 + 20)
    vi.restoreAllMocks()
  })

  it("applies velocity deviation within bounds", () => {
    // Mock random to return 0 (maximum negative)
    vi.spyOn(Math, "random").mockReturnValue(0)
    const maxVel = 10
    const result = humanizeNotes(notes, 0, maxVel)
    // Math.random() = 0 → (0 * 2 - 1) * 10 = -10
    expect(result[0].velocity).toBe(70) // 80 - 10
    expect(result[1].velocity).toBe(90) // 100 - 10
    expect(result[2].velocity).toBe(50) // 60 - 10
    vi.restoreAllMocks()
  })

  it("preserves note properties other than tick and velocity", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5)
    const result = humanizeNotes(notes, 10, 10)
    for (let i = 0; i < notes.length; i++) {
      expect(result[i].noteNumber).toBe(notes[i].noteNumber)
      expect(result[i].duration).toBe(notes[i].duration)
    }
    vi.restoreAllMocks()
  })

  it("handles empty notes array", () => {
    expect(humanizeNotes([], 10, 10)).toEqual([])
  })
})
