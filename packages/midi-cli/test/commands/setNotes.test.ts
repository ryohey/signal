import { describe, expect, it } from "vitest"
import { parsePosition } from "../../src/parse/position.js"
import type { NoteStreamContext, SerializedNote } from "../../src/types.js"

const context: NoteStreamContext = {
  timebase: 480,
  measures: [{ tick: 0, measure: 0, numerator: 4, denominator: 4 }],
}

const trackNotes: SerializedNote[] = [
  // Measure 1
  { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
  { tick: 480, duration: 480, noteNumber: 64, velocity: 80 },
  { tick: 960, duration: 480, noteNumber: 67, velocity: 90 },
  { tick: 1440, duration: 480, noteNumber: 72, velocity: 110 },
  // Measure 2
  { tick: 1920, duration: 480, noteNumber: 62, velocity: 100 },
  { tick: 2400, duration: 480, noteNumber: 65, velocity: 85 },
  { tick: 2880, duration: 480, noteNumber: 69, velocity: 95 },
  { tick: 3360, duration: 480, noteNumber: 74, velocity: 105 },
  // Measure 3
  { tick: 3840, duration: 480, noteNumber: 64, velocity: 100 },
  { tick: 4320, duration: 480, noteNumber: 67, velocity: 90 },
]

// Simulate set-notes replace range logic (matching src/commands/setNotes.ts)
function computeRemoveRange(
  streamCtx: NoteStreamContext,
  options: { from?: string; to?: string },
): { fromTick: number; toTick: number } {
  const selection = streamCtx.selection

  let fromTick = selection?.fromTick ?? 0
  let toTick = selection?.toTick ?? Number.POSITIVE_INFINITY

  if (options.from) {
    fromTick = parsePosition(
      options.from,
      streamCtx.timebase,
      streamCtx.measures,
    )
  }
  if (options.to) {
    toTick = parsePosition(options.to, streamCtx.timebase, streamCtx.measures)
  }

  return { fromTick, toTick }
}

// Simulate the full replace: remove notes in range, add new ones
function simulateSetNotes(
  existing: SerializedNote[],
  incoming: SerializedNote[],
  streamCtx: NoteStreamContext,
  options: { from?: string; to?: string },
): SerializedNote[] {
  const { fromTick, toTick } = computeRemoveRange(streamCtx, options)
  const kept = existing.filter((n) => n.tick < fromTick || n.tick >= toTick)
  return [...kept, ...incoming].sort((a, b) => a.tick - b.tick)
}

describe("set-notes with selection metadata from position parsing", () => {
  it("selection from get-notes m1 scopes replacement to measure 1", () => {
    const streamCtx: NoteStreamContext = {
      ...context,
      selection: {
        fromTick: parsePosition("m1-1", context.timebase, context.measures),
        toTick: parsePosition("m2-1", context.timebase, context.measures),
      },
    }
    const incoming: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 72, velocity: 100 },
      { tick: 480, duration: 480, noteNumber: 67, velocity: 100 },
    ]
    const result = simulateSetNotes(trackNotes, incoming, streamCtx, {})

    // Measure 1 replaced (4 removed, 2 added), measures 2-3 preserved
    expect(result).toHaveLength(8) // 2 new + 4 m2 + 2 m3
    // Measure 2 notes intact
    expect(result.find((n) => n.tick === 1920)?.noteNumber).toBe(62)
    expect(result.find((n) => n.tick === 3360)?.noteNumber).toBe(74)
    // Measure 3 notes intact
    expect(result.find((n) => n.tick === 3840)?.noteNumber).toBe(64)
  })

  it("selection from get-notes m2 scopes replacement to measure 2", () => {
    const streamCtx: NoteStreamContext = {
      ...context,
      selection: {
        fromTick: parsePosition("m2-1", context.timebase, context.measures),
        toTick: parsePosition("m3-1", context.timebase, context.measures),
      },
    }
    const incoming: SerializedNote[] = [
      { tick: 1920, duration: 480, noteNumber: 48, velocity: 127 },
    ]
    const result = simulateSetNotes(trackNotes, incoming, streamCtx, {})

    // Measure 2 replaced (4 removed, 1 added), measures 1 and 3 preserved
    expect(result).toHaveLength(7) // 4 m1 + 1 new + 2 m3
    expect(result.find((n) => n.tick === 0)?.noteNumber).toBe(60) // m1 preserved
    expect(result.find((n) => n.tick === 3840)?.noteNumber).toBe(64) // m3 preserved
  })

  it("no selection removes all notes (full track replacement)", () => {
    const streamCtx = { ...context } // no selection
    const incoming: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 48, velocity: 100 },
    ]
    const result = simulateSetNotes(trackNotes, incoming, streamCtx, {})
    expect(result).toHaveLength(1)
  })

  it("explicit --from/--to overrides selection", () => {
    const streamCtx: NoteStreamContext = {
      ...context,
      selection: { fromTick: 0, toTick: 1920 },
    }
    const incoming: SerializedNote[] = []
    // Override: only remove measure 2 notes
    const result = simulateSetNotes(trackNotes, incoming, streamCtx, {
      from: "m2-1",
      to: "m3-1",
    })
    // Measure 2 removed (4 notes), measures 1 and 3 preserved
    expect(result).toHaveLength(6) // 4 m1 + 2 m3
  })

  it("selection with only --from preserves notes before the range", () => {
    const streamCtx: NoteStreamContext = {
      ...context,
      selection: {
        fromTick: parsePosition("m3-1", context.timebase, context.measures),
        toTick: Number.POSITIVE_INFINITY,
      },
    }
    const incoming: SerializedNote[] = [
      { tick: 3840, duration: 960, noteNumber: 48, velocity: 100 },
    ]
    const result = simulateSetNotes(trackNotes, incoming, streamCtx, {})

    // Measures 1-2 preserved (8 notes), measure 3 replaced (2 removed, 1 added)
    expect(result).toHaveLength(9)
    expect(result.find((n) => n.tick === 0)?.noteNumber).toBe(60)
    expect(result.find((n) => n.tick === 3360)?.noteNumber).toBe(74)
  })
})

describe("end-to-end pipeline simulation: get-notes | retrograde | set-notes", () => {
  function retrograde(notes: SerializedNote[]): SerializedNote[] {
    if (notes.length <= 1) return [...notes]
    const sorted = [...notes].sort((a, b) => a.tick - b.tick)
    const first = sorted[0].tick
    const last = sorted[sorted.length - 1].tick
    const result = notes.map((n) => ({ ...n, tick: first + (last - n.tick) }))
    result.sort((a, b) => a.tick - b.tick)
    return result
  }

  it("get-notes m1 | retrograde | set-notes preserves measures 2-3", () => {
    // Step 1: get-notes --from m1-1 --to m2-1
    const fromTick = parsePosition("m1-1", context.timebase, context.measures)
    const toTick = parsePosition("m2-1", context.timebase, context.measures)
    const selected = trackNotes.filter(
      (n) => n.tick >= fromTick && n.tick < toTick,
    )
    expect(selected).toHaveLength(4)

    // Step 2: retrograde
    const reversed = retrograde(selected)
    expect(reversed.map((n) => n.noteNumber)).toEqual([72, 67, 64, 60])

    // Step 3: set-notes using selection metadata
    const streamCtx: NoteStreamContext = {
      ...context,
      selection: { fromTick, toTick },
    }
    const result = simulateSetNotes(trackNotes, reversed, streamCtx, {})

    // All 10 notes present (4 replaced + 6 preserved)
    expect(result).toHaveLength(10)
    // Measure 1 is reversed
    expect(
      result.filter((n) => n.tick < 1920).map((n) => n.noteNumber),
    ).toEqual([72, 67, 64, 60])
    // Measure 2 is untouched
    expect(
      result
        .filter((n) => n.tick >= 1920 && n.tick < 3840)
        .map((n) => n.noteNumber),
    ).toEqual([62, 65, 69, 74])
    // Measure 3 is untouched
    expect(
      result.filter((n) => n.tick >= 3840).map((n) => n.noteNumber),
    ).toEqual([64, 67])
  })

  it("get-notes m2 | retrograde | set-notes preserves measures 1 and 3", () => {
    const fromTick = parsePosition("m2-1", context.timebase, context.measures)
    const toTick = parsePosition("m3-1", context.timebase, context.measures)
    const selected = trackNotes.filter(
      (n) => n.tick >= fromTick && n.tick < toTick,
    )
    const reversed = retrograde(selected)

    const streamCtx: NoteStreamContext = {
      ...context,
      selection: { fromTick, toTick },
    }
    const result = simulateSetNotes(trackNotes, reversed, streamCtx, {})

    expect(result).toHaveLength(10)
    // Measure 1 untouched
    expect(
      result.filter((n) => n.tick < 1920).map((n) => n.noteNumber),
    ).toEqual([60, 64, 67, 72])
    // Measure 2 reversed
    expect(
      result
        .filter((n) => n.tick >= 1920 && n.tick < 3840)
        .map((n) => n.noteNumber),
    ).toEqual([74, 69, 65, 62])
    // Measure 3 untouched
    expect(
      result.filter((n) => n.tick >= 3840).map((n) => n.noteNumber),
    ).toEqual([64, 67])
  })
})
