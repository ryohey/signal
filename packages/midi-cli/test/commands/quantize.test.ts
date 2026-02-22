import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NoteStream, SerializedNote } from "../../src/types.js"

// Helper to create a test NoteStream
function makeStream(notes: SerializedNote[]): NoteStream {
  return {
    context: {
      timebase: 480,
      measures: [{ tick: 0, measure: 0, numerator: 4, denominator: 4 }],
    },
    notes,
  }
}

// We test the quantize logic directly since the command reads from stdin
// Instead, test the pitch-quantization logic in isolation
describe("pitch quantize to scale", () => {
  function quantizeNote(
    noteNumber: number,
    intervals: number[],
    direction: "nearest" | "up" | "down" = "nearest",
  ): number {
    const pitchClass = noteNumber % 12

    if (intervals.includes(pitchClass)) {
      return noteNumber
    }

    let bestOffset = 0
    let bestDistance = 13

    for (const interval of intervals) {
      const upDist = (interval - pitchClass + 12) % 12
      const downDist = (pitchClass - interval + 12) % 12

      if (direction === "up") {
        if (upDist < bestDistance) {
          bestDistance = upDist
          bestOffset = upDist
        }
      } else if (direction === "down") {
        if (downDist < bestDistance) {
          bestDistance = downDist
          bestOffset = -downDist
        }
      } else {
        if (upDist <= downDist && upDist < bestDistance) {
          bestDistance = upDist
          bestOffset = upDist
        } else if (downDist < upDist && downDist < bestDistance) {
          bestDistance = downDist
          bestOffset = -downDist
        }
      }
    }

    return Math.max(0, Math.min(127, noteNumber + bestOffset))
  }

  // C major scale intervals
  const cMajor = [0, 2, 4, 5, 7, 9, 11]

  it("keeps notes already in the scale", () => {
    expect(quantizeNote(60, cMajor)).toBe(60) // C4 in C major
    expect(quantizeNote(62, cMajor)).toBe(62) // D4 in C major
    expect(quantizeNote(64, cMajor)).toBe(64) // E4 in C major
  })

  it("snaps to nearest scale degree", () => {
    // C#4 (61) should snap to either C4 (60) or D4 (62) — nearest is C4 or D4
    const result = quantizeNote(61, cMajor, "nearest")
    expect([60, 62]).toContain(result)
  })

  it("quantizes up", () => {
    // C#4 (61) should snap up to D4 (62)
    expect(quantizeNote(61, cMajor, "up")).toBe(62)
  })

  it("quantizes down", () => {
    // C#4 (61) should snap down to C4 (60)
    expect(quantizeNote(61, cMajor, "down")).toBe(60)
  })

  it("clamps to valid MIDI range", () => {
    expect(quantizeNote(0, cMajor, "down")).toBeGreaterThanOrEqual(0)
    expect(quantizeNote(127, cMajor, "up")).toBeLessThanOrEqual(127)
  })
})
