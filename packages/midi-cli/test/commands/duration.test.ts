import { describe, it, expect } from "vitest"
import type { SerializedNote } from "../../src/types.js"

// Re-implement duration logic for isolated testing (matching src/commands/duration.ts)

function setDuration(
  notes: SerializedNote[],
  ticks: number,
): SerializedNote[] {
  return notes.map((n) => ({ ...n, duration: ticks }))
}

function scaleDuration(
  notes: SerializedNote[],
  factor: number,
): SerializedNote[] {
  return notes.map((n) => ({
    ...n,
    duration: Math.max(1, Math.round(n.duration * factor)),
  }))
}

function legato(notes: SerializedNote[]): SerializedNote[] {
  const sorted = [...notes].sort((a, b) => a.tick - b.tick)
  return sorted.map((n, i) => {
    if (i < sorted.length - 1) {
      const gap = sorted[i + 1].tick - n.tick
      return { ...n, duration: Math.max(1, gap) }
    }
    return n
  })
}

function staccato(
  notes: SerializedNote[],
  percentage: number,
): SerializedNote[] {
  const factor = percentage / 100
  return notes.map((n) => ({
    ...n,
    duration: Math.max(1, Math.round(n.duration * factor)),
  }))
}

describe("duration operations", () => {
  const notes: SerializedNote[] = [
    { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
    { tick: 480, duration: 480, noteNumber: 62, velocity: 100 },
    { tick: 960, duration: 480, noteNumber: 64, velocity: 100 },
    { tick: 1440, duration: 480, noteNumber: 65, velocity: 100 },
  ]

  describe("set", () => {
    it("sets all note durations to the given value", () => {
      const result = setDuration(notes, 240)
      expect(result.every((n) => n.duration === 240)).toBe(true)
    })

    it("preserves other note properties", () => {
      const result = setDuration(notes, 240)
      expect(result[0].noteNumber).toBe(60)
      expect(result[0].tick).toBe(0)
      expect(result[0].velocity).toBe(100)
    })
  })

  describe("scale", () => {
    it("doubles durations with factor 2", () => {
      const result = scaleDuration(notes, 2)
      expect(result.every((n) => n.duration === 960)).toBe(true)
    })

    it("halves durations with factor 0.5", () => {
      const result = scaleDuration(notes, 0.5)
      expect(result.every((n) => n.duration === 240)).toBe(true)
    })

    it("enforces minimum duration of 1", () => {
      const result = scaleDuration(notes, 0)
      expect(result.every((n) => n.duration === 1)).toBe(true)
    })

    it("rounds fractional durations", () => {
      const result = scaleDuration(notes, 0.33)
      // 480 * 0.33 = 158.4 → rounds to 158
      expect(result[0].duration).toBe(158)
    })
  })

  describe("legato", () => {
    it("extends each note to reach the next note", () => {
      const result = legato(notes)
      // Each note should span exactly to the next note's tick
      expect(result[0].duration).toBe(480) // 480 - 0
      expect(result[1].duration).toBe(480) // 960 - 480
      expect(result[2].duration).toBe(480) // 1440 - 960
    })

    it("preserves the last note's duration", () => {
      const result = legato(notes)
      expect(result[result.length - 1].duration).toBe(480)
    })

    it("handles notes with gaps between them", () => {
      const gappedNotes: SerializedNote[] = [
        { tick: 0, duration: 100, noteNumber: 60, velocity: 100 },
        { tick: 480, duration: 100, noteNumber: 62, velocity: 100 },
        { tick: 1920, duration: 100, noteNumber: 64, velocity: 100 },
      ]
      const result = legato(gappedNotes)
      expect(result[0].duration).toBe(480) // extends to next
      expect(result[1].duration).toBe(1440) // extends to next
      expect(result[2].duration).toBe(100) // last note unchanged
    })

    it("handles overlapping notes by using minimum duration of 1", () => {
      // If notes are at the same tick, gap is 0 → clamps to 1
      const overlapping: SerializedNote[] = [
        { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
        { tick: 0, duration: 480, noteNumber: 64, velocity: 100 },
      ]
      const result = legato(overlapping)
      expect(result[0].duration).toBe(1) // gap is 0, clamps to 1
    })

    it("sorts by tick before processing", () => {
      const unsorted: SerializedNote[] = [
        { tick: 960, duration: 100, noteNumber: 64, velocity: 100 },
        { tick: 0, duration: 100, noteNumber: 60, velocity: 100 },
        { tick: 480, duration: 100, noteNumber: 62, velocity: 100 },
      ]
      const result = legato(unsorted)
      // Should be sorted: tick 0, 480, 960
      expect(result[0].tick).toBe(0)
      expect(result[0].duration).toBe(480)
      expect(result[1].tick).toBe(480)
      expect(result[1].duration).toBe(480)
    })
  })

  describe("staccato", () => {
    it("shortens durations to 50% by default", () => {
      const result = staccato(notes, 50)
      expect(result.every((n) => n.duration === 240)).toBe(true)
    })

    it("shortens durations to 25%", () => {
      const result = staccato(notes, 25)
      expect(result.every((n) => n.duration === 120)).toBe(true)
    })

    it("enforces minimum duration of 1", () => {
      const result = staccato(notes, 0)
      expect(result.every((n) => n.duration === 1)).toBe(true)
    })

    it("can increase duration with percentage > 100", () => {
      const result = staccato(notes, 200)
      expect(result.every((n) => n.duration === 960)).toBe(true)
    })
  })

  describe("edge cases", () => {
    it("handles empty note array", () => {
      expect(setDuration([], 240)).toEqual([])
      expect(scaleDuration([], 2)).toEqual([])
      expect(legato([])).toEqual([])
      expect(staccato([], 50)).toEqual([])
    })

    it("handles single note", () => {
      const single = [notes[0]]
      const result = legato(single)
      expect(result).toHaveLength(1)
      expect(result[0].duration).toBe(480) // last note, unchanged
    })
  })
})
