import { describe, expect, it } from "vitest"
import { parsePosition } from "../../src/parse/position.js"
import type {
  NoteStream,
  NoteStreamContext,
  SerializedNote,
} from "../../src/types.js"

// Uses real parsePosition to test with m1-1 style strings

const context: NoteStreamContext = {
  timebase: 480,
  measures: [{ tick: 0, measure: 0, numerator: 4, denominator: 4 }],
}

const allNotes: SerializedNote[] = [
  // Measure 1: ticks 0–1919
  { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
  { tick: 480, duration: 480, noteNumber: 64, velocity: 80 },
  { tick: 960, duration: 480, noteNumber: 67, velocity: 90 },
  { tick: 1440, duration: 480, noteNumber: 72, velocity: 110 },
  // Measure 2: ticks 1920–3839
  { tick: 1920, duration: 480, noteNumber: 62, velocity: 100 },
  { tick: 2400, duration: 480, noteNumber: 65, velocity: 85 },
  { tick: 2880, duration: 480, noteNumber: 69, velocity: 95 },
  { tick: 3360, duration: 480, noteNumber: 74, velocity: 105 },
  // Measure 3: ticks 3840–
  { tick: 3840, duration: 480, noteNumber: 64, velocity: 100 },
  { tick: 4320, duration: 480, noteNumber: 67, velocity: 90 },
]

// Simulate get-notes logic using real parsePosition
function getNotesWithParsing(
  notes: SerializedNote[],
  ctx: NoteStreamContext,
  options: { from?: string; to?: string },
): NoteStream {
  let filtered = notes
  let fromTick: number | undefined
  let toTick: number | undefined

  if (options.from) {
    fromTick = parsePosition(options.from, ctx.timebase, ctx.measures)
    const ft = fromTick
    filtered = filtered.filter((n) => n.tick >= ft)
  }
  if (options.to) {
    toTick = parsePosition(options.to, ctx.timebase, ctx.measures)
    const tt = toTick
    filtered = filtered.filter((n) => n.tick < tt)
  }

  const selection =
    fromTick !== undefined || toTick !== undefined
      ? { fromTick: fromTick ?? 0, toTick: toTick ?? Number.POSITIVE_INFINITY }
      : ctx.selection

  return { context: { ...ctx, selection }, notes: filtered }
}

describe("get-notes with position parsing", () => {
  it("m1-1 resolves to tick 0", () => {
    const tick = parsePosition("m1-1", context.timebase, context.measures)
    expect(tick).toBe(0)
  })

  it("m2-1 resolves to tick 1920", () => {
    const tick = parsePosition("m2-1", context.timebase, context.measures)
    expect(tick).toBe(1920)
  })

  it("m3-1 resolves to tick 3840", () => {
    const tick = parsePosition("m3-1", context.timebase, context.measures)
    expect(tick).toBe(3840)
  })

  it("m1-2 resolves to tick 480 (second beat)", () => {
    const tick = parsePosition("m1-2", context.timebase, context.measures)
    expect(tick).toBe(480)
  })

  it("--from m1-1 --to m2-1 selects measure 1 notes", () => {
    const result = getNotesWithParsing(allNotes, context, {
      from: "m1-1",
      to: "m2-1",
    })
    expect(result.notes).toHaveLength(4)
    expect(result.notes.map((n) => n.noteNumber)).toEqual([60, 64, 67, 72])
  })

  it("--from m2-1 --to m3-1 selects measure 2 notes", () => {
    const result = getNotesWithParsing(allNotes, context, {
      from: "m2-1",
      to: "m3-1",
    })
    expect(result.notes).toHaveLength(4)
    expect(result.notes.map((n) => n.noteNumber)).toEqual([62, 65, 69, 74])
  })

  it("--from m1-1 selects all notes", () => {
    const result = getNotesWithParsing(allNotes, context, { from: "m1-1" })
    expect(result.notes).toHaveLength(10)
  })

  it("--to m2-1 selects measure 1 notes", () => {
    const result = getNotesWithParsing(allNotes, context, { to: "m2-1" })
    expect(result.notes).toHaveLength(4)
  })

  it("--from m3-1 selects measure 3 notes only", () => {
    const result = getNotesWithParsing(allNotes, context, { from: "m3-1" })
    expect(result.notes).toHaveLength(2)
    expect(result.notes.map((n) => n.noteNumber)).toEqual([64, 67])
  })
})

describe("get-notes selection metadata", () => {
  it("sets selection range when --from and --to are used", () => {
    const result = getNotesWithParsing(allNotes, context, {
      from: "m1-1",
      to: "m2-1",
    })
    expect(result.context.selection).toEqual({ fromTick: 0, toTick: 1920 })
  })

  it("sets toTick=Infinity when only --from is used", () => {
    const result = getNotesWithParsing(allNotes, context, { from: "m2-1" })
    expect(result.context.selection).toEqual({
      fromTick: 1920,
      toTick: Number.POSITIVE_INFINITY,
    })
  })

  it("sets fromTick=0 when only --to is used", () => {
    const result = getNotesWithParsing(allNotes, context, { to: "m3-1" })
    expect(result.context.selection).toEqual({ fromTick: 0, toTick: 3840 })
  })

  it("no selection when neither --from nor --to is used", () => {
    const result = getNotesWithParsing(allNotes, context, {})
    expect(result.context.selection).toBeUndefined()
  })

  it("preserves upstream selection when no --from/--to", () => {
    const ctxWithSel: NoteStreamContext = {
      ...context,
      selection: { fromTick: 100, toTick: 200 },
    }
    const result = getNotesWithParsing(allNotes, ctxWithSel, {})
    expect(result.context.selection).toEqual({ fromTick: 100, toTick: 200 })
  })
})

describe("get-notes | transform pipeline", () => {
  function retrograde(notes: SerializedNote[]): SerializedNote[] {
    if (notes.length <= 1) return [...notes]
    const sorted = [...notes].sort((a, b) => a.tick - b.tick)
    const first = sorted[0].tick
    const last = sorted[sorted.length - 1].tick
    const result = notes.map((n) => ({ ...n, tick: first + (last - n.tick) }))
    result.sort((a, b) => a.tick - b.tick)
    return result
  }

  function transpose(
    notes: SerializedNote[],
    semitones: number,
  ): SerializedNote[] {
    return notes.map((n) => ({
      ...n,
      noteNumber: Math.max(0, Math.min(127, n.noteNumber + semitones)),
    }))
  }

  it("get-notes m1 | retrograde reverses measure 1 and preserves selection", () => {
    const selected = getNotesWithParsing(allNotes, context, {
      from: "m1-1",
      to: "m2-1",
    })
    const reversed = retrograde(selected.notes)

    expect(reversed).toHaveLength(4)
    expect(reversed.map((n) => n.noteNumber)).toEqual([72, 67, 64, 60])

    // Selection metadata survives (context passed through)
    expect(selected.context.selection).toEqual({ fromTick: 0, toTick: 1920 })
  })

  it("get-notes m2 | transpose 12 shifts measure 2 up an octave", () => {
    const selected = getNotesWithParsing(allNotes, context, {
      from: "m2-1",
      to: "m3-1",
    })
    const transposed = transpose(selected.notes, 12)

    expect(transposed).toHaveLength(4)
    expect(transposed.map((n) => n.noteNumber)).toEqual([74, 77, 81, 86])
    expect(selected.context.selection).toEqual({ fromTick: 1920, toTick: 3840 })
  })

  it("get-notes m1-m3 | retrograde | transpose 2 chains three stages", () => {
    const selected = getNotesWithParsing(allNotes, context, {
      from: "m1-1",
      to: "m3-1",
    })
    const reversed = retrograde(selected.notes)
    const final = transpose(reversed, 2)

    expect(final).toHaveLength(8)
    // Selection metadata intact after transforms
    expect(selected.context.selection).toEqual({ fromTick: 0, toTick: 3840 })
  })

  it("selection range correctly scopes which notes to replace", () => {
    const selected = getNotesWithParsing(allNotes, context, {
      from: "m1-1",
      to: "m2-1",
    })
    const reversed = retrograde(selected.notes)
    expect(selected.context.selection).toBeDefined()
    const selFrom = selected.context.selection?.fromTick ?? 0
    const selTo = selected.context.selection?.toTick ?? 0

    // Notes outside selection are preserved
    const kept = allNotes.filter((n) => n.tick < selFrom || n.tick >= selTo)
    expect(kept).toHaveLength(6) // measures 2 + 3

    // Final result: replaced measure 1 + preserved measures 2-3
    const finalNotes = [...kept, ...reversed].sort((a, b) => a.tick - b.tick)
    expect(finalNotes).toHaveLength(10)
  })
})
