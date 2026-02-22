import { describe, expect, it } from "vitest"
import type { SerializedNote } from "../../src/types.js"

function transposeNote(
  note: SerializedNote,
  semitones: number,
): SerializedNote {
  return {
    ...note,
    noteNumber: Math.max(0, Math.min(127, note.noteNumber + semitones)),
  }
}

describe("transpose logic", () => {
  const note: SerializedNote = {
    tick: 0,
    duration: 480,
    noteNumber: 60,
    velocity: 100,
  }

  it("transposes up by 12 semitones (one octave)", () => {
    expect(transposeNote(note, 12).noteNumber).toBe(72)
  })

  it("transposes down by 12 semitones", () => {
    expect(transposeNote(note, -12).noteNumber).toBe(48)
  })

  it("clamps to 0 when transposing below range", () => {
    expect(transposeNote(note, -100).noteNumber).toBe(0)
  })

  it("clamps to 127 when transposing above range", () => {
    expect(transposeNote(note, 100).noteNumber).toBe(127)
  })

  it("transposes by 0 (no change)", () => {
    expect(transposeNote(note, 0).noteNumber).toBe(60)
  })
})
