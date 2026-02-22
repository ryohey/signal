import { describe, expect, it } from "vitest"
import { executeCommand } from "./midiCommands"

// Build a NoteStream directly (no Song/Track/MobX dependency)
function makeStream() {
  return {
    context: {
      timebase: 480,
      measures: [{ tick: 0, measure: 0, numerator: 4, denominator: 4 }],
    },
    notes: [
      // Measure 1: ticks 0–1919
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100, id: 1 },
      { tick: 480, duration: 480, noteNumber: 64, velocity: 80, id: 2 },
      { tick: 960, duration: 480, noteNumber: 67, velocity: 90, id: 3 },
      { tick: 1440, duration: 480, noteNumber: 72, velocity: 110, id: 4 },
      // Measure 2: ticks 1920–3839
      { tick: 1920, duration: 480, noteNumber: 62, velocity: 100, id: 5 },
      { tick: 2400, duration: 480, noteNumber: 65, velocity: 85, id: 6 },
      { tick: 2880, duration: 480, noteNumber: 69, velocity: 95, id: 7 },
      { tick: 3360, duration: 480, noteNumber: 74, velocity: 105, id: 8 },
      // Measure 3: ticks 3840–5759
      { tick: 3840, duration: 480, noteNumber: 64, velocity: 100, id: 9 },
      { tick: 4320, duration: 480, noteNumber: 67, velocity: 90, id: 10 },
    ],
  }
}

describe("executeCommand integration", () => {
  describe("get-notes with position parsing", () => {
    it("get-notes --from m1-1 --to m2-1 selects measure 1 notes", () => {
      const stream = makeStream()
      const result = executeCommand("get-notes --from m1-1 --to m2-1", stream)
      expect(result.stream.notes).toHaveLength(4)
      expect(result.stream.notes.map((n) => n.noteNumber)).toEqual([
        60, 64, 67, 72,
      ])
    })

    it("get-notes --from m2-1 --to m3-1 selects measure 2 notes", () => {
      const stream = makeStream()
      const result = executeCommand("get-notes --from m2-1 --to m3-1", stream)
      expect(result.stream.notes).toHaveLength(4)
      expect(result.stream.notes.map((n) => n.noteNumber)).toEqual([
        62, 65, 69, 74,
      ])
    })

    it("get-notes --from m1-1 selects all notes from measure 1 onwards", () => {
      const stream = makeStream()
      const result = executeCommand("get-notes --from m1-1", stream)
      expect(result.stream.notes).toHaveLength(10)
    })

    it("get-notes --to m2-1 selects notes before measure 2", () => {
      const stream = makeStream()
      const result = executeCommand("get-notes --to m2-1", stream)
      expect(result.stream.notes).toHaveLength(4)
    })

    it("sets selection metadata with correct tick range", () => {
      const stream = makeStream()
      const result = executeCommand("get-notes --from m1-1 --to m2-1", stream)
      expect(result.stream.context.selection).toEqual({
        fromTick: 0,
        toTick: 1920,
      })
    })

    it("get-notes --from m2-1 sets selection with toTick=Infinity", () => {
      const stream = makeStream()
      const result = executeCommand("get-notes --from m2-1", stream)
      expect(result.stream.context.selection).toEqual({
        fromTick: 1920,
        toTick: Number.POSITIVE_INFINITY,
      })
    })
  })

  describe("--start/--end aliases", () => {
    it("get-notes --start m1-1 --end m2-1 works like --from/--to", () => {
      const stream = makeStream()
      const result = executeCommand("get-notes --start m1-1 --end m2-1", stream)
      expect(result.stream.notes).toHaveLength(4)
      expect(result.stream.notes.map((n) => n.noteNumber)).toEqual([
        60, 64, 67, 72,
      ])
      expect(result.stream.context.selection).toEqual({
        fromTick: 0,
        toTick: 1920,
      })
    })

    it("filter --start m2-1 --end m3-1 works like --from/--to", () => {
      const stream = makeStream()
      const result = executeCommand("filter --start m2-1 --end m3-1", stream)
      expect(result.stream.notes).toHaveLength(4)
      expect(result.stream.notes.map((n) => n.noteNumber)).toEqual([
        62, 65, 69, 74,
      ])
    })

    it("get-notes --start m1-1 --end m2-1 | retrograde", () => {
      const stream = makeStream()
      const result = executeCommand(
        "get-notes --start m1-1 --end m2-1 | retrograde",
        stream,
      )
      expect(result.stream.notes).toHaveLength(4)
      expect(result.stream.notes.map((n) => n.noteNumber)).toEqual([
        72, 67, 64, 60,
      ])
    })
  })

  describe("m0 edge case (clamp to tick 0)", () => {
    it("m0-0 clamps to tick 0 instead of going negative", () => {
      const stream = makeStream()
      const result = executeCommand("get-notes --from m0-0 --to m2-1", stream)
      // m0-0 clamps to 0, m2-1 = 1920 → selects measures 1
      expect(result.stream.notes).toHaveLength(4)
      expect(result.stream.context.selection?.fromTick).toBe(0)
    })

    it("m0 clamps to tick 0", () => {
      const stream = makeStream()
      const result = executeCommand("get-notes --from m0 --to m1-1", stream)
      // m0 clamps to 0, m1-1 = 0 → empty range [0, 0)
      expect(result.stream.notes).toHaveLength(0)
    })
  })

  describe("piped commands", () => {
    it("get-notes --from m1-1 --to m2-1 | retrograde", () => {
      const stream = makeStream()
      const result = executeCommand(
        "get-notes --from m1-1 --to m2-1 | retrograde",
        stream,
      )
      // 4 notes from measure 1, reversed in time
      expect(result.stream.notes).toHaveLength(4)
      expect(result.stream.notes.map((n) => n.noteNumber)).toEqual([
        72, 67, 64, 60,
      ])
      // Selection metadata survives the pipeline
      expect(result.stream.context.selection).toEqual({
        fromTick: 0,
        toTick: 1920,
      })
    })

    it("get-notes --from m2-1 --to m3-1 | transpose 12", () => {
      const stream = makeStream()
      const result = executeCommand(
        "get-notes --from m2-1 --to m3-1 | transpose 12",
        stream,
      )
      expect(result.stream.notes).toHaveLength(4)
      expect(result.stream.notes.map((n) => n.noteNumber)).toEqual([
        74, 77, 81, 86,
      ])
      expect(result.stream.context.selection).toEqual({
        fromTick: 1920,
        toTick: 3840,
      })
    })

    it("get-notes --from m1-1 --to m2-1 | velocity set 127", () => {
      const stream = makeStream()
      const result = executeCommand(
        "get-notes --from m1-1 --to m2-1 | velocity set 127",
        stream,
      )
      expect(result.stream.notes).toHaveLength(4)
      expect(result.stream.notes.every((n) => n.velocity === 127)).toBe(true)
      expect(result.stream.context.selection).toBeDefined()
    })

    it("get-notes --from m1-1 --to m3-1 | retrograde | transpose 2", () => {
      const stream = makeStream()
      const result = executeCommand(
        "get-notes --from m1-1 --to m3-1 | retrograde | transpose 2",
        stream,
      )
      // 8 notes from measures 1–2, reversed, then transposed up 2
      expect(result.stream.notes).toHaveLength(8)
      // Selection metadata still intact after two transforms
      expect(result.stream.context.selection).toEqual({
        fromTick: 0,
        toTick: 3840,
      })
    })

    it("transpose 5 | velocity scale 0.5 (no get-notes, no selection)", () => {
      const stream = makeStream()
      const result = executeCommand("transpose 5 | velocity scale 0.5", stream)
      expect(result.stream.notes).toHaveLength(10)
      // No selection metadata since no get-notes was used
      expect(result.stream.context.selection).toBeUndefined()
    })

    it("filter --from m1-1 --to m2-1 | invert", () => {
      const stream = makeStream()
      const result = executeCommand(
        "filter --from m1-1 --to m2-1 | invert",
        stream,
      )
      expect(result.stream.notes).toHaveLength(4)
      // filter also sets selection metadata
      expect(result.stream.context.selection).toEqual({
        fromTick: 0,
        toTick: 1920,
      })
    })

    it("get-notes --from m1-1 --to m2-1 | shift +1m", () => {
      const stream = makeStream()
      const result = executeCommand(
        "get-notes --from m1-1 --to m2-1 | shift +1m",
        stream,
      )
      // 4 notes shifted by 1 measure (1920 ticks)
      expect(result.stream.notes).toHaveLength(4)
      expect(result.stream.notes[0].tick).toBe(1920)
      expect(result.stream.notes[3].tick).toBe(3360)
      expect(result.stream.context.selection).toEqual({
        fromTick: 0,
        toTick: 1920,
      })
    })

    it("get-notes --pitch 60-67 | transpose -12", () => {
      const stream = makeStream()
      const result = executeCommand(
        "get-notes --pitch 60-67 | transpose -12",
        stream,
      )
      // Notes with noteNumber 60,64,67,62,65,64,67 = 7 notes
      expect(result.stream.notes).toHaveLength(7)
      expect(result.stream.notes.every((n) => n.noteNumber <= 55)).toBe(true)
    })
  })

  describe("selection metadata write-back correctness", () => {
    it("get-notes selection limits which notes would be replaced", () => {
      const stream = makeStream()
      const result = executeCommand(
        "get-notes --from m1-1 --to m2-1 | retrograde",
        stream,
      )

      expect(result.stream.context.selection).toBeDefined()
      const fromTick = result.stream.context.selection?.fromTick ?? 0
      const toTick = result.stream.context.selection?.toTick ?? 0
      expect(fromTick).toBe(0)
      expect(toTick).toBe(1920)

      // Only notes in measure 1 (ticks 0..1919) should be in the removal range
      const keptNotes = stream.notes.filter(
        (n) => n.tick < fromTick || n.tick >= toTick,
      )
      // Measures 2 and 3 have 6 notes, all should be preserved
      expect(keptNotes).toHaveLength(6)

      // The result has 4 retrograded notes + 6 kept = 10 total
      const finalNotes = [...keptNotes, ...result.stream.notes].sort(
        (a, b) => a.tick - b.tick,
      )
      expect(finalNotes).toHaveLength(10)
    })

    it("without get-notes, all notes would be replaced (no selection)", () => {
      const stream = makeStream()
      const result = executeCommand("retrograde", stream)
      expect(result.stream.context.selection).toBeUndefined()
      // No selection = full range replacement (expected behavior)
    })

    it("get-notes --from m3-1 | retrograde preserves measures 1-2", () => {
      const stream = makeStream()
      const result = executeCommand(
        "get-notes --from m3-1 | retrograde",
        stream,
      )

      expect(result.stream.context.selection).toBeDefined()
      const selFrom = result.stream.context.selection?.fromTick ?? 0
      const selTo = result.stream.context.selection?.toTick ?? 0
      expect(selFrom).toBe(3840)

      // Notes in measures 1–2 are outside the selection
      const keptNotes = stream.notes.filter(
        (n) => n.tick < selFrom || n.tick >= selTo,
      )
      expect(keptNotes).toHaveLength(8)
    })
  })
})
