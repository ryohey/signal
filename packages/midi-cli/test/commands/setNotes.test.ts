import { describe, expect, it } from "vitest"
import type { NoteStreamContext, SerializedNote } from "../../src/types.js"

// Simulate set-notes replace range logic for isolated testing

function computeRemoveRange(
  streamContext: NoteStreamContext,
  options: { from?: number; to?: number },
): { fromTick: number; toTick: number } {
  const selection = streamContext.selection

  let fromTick = selection?.fromTick ?? 0
  let toTick = selection?.toTick ?? Number.POSITIVE_INFINITY

  if (options.from !== undefined) {
    fromTick = options.from
  }
  if (options.to !== undefined) {
    toTick = options.to
  }

  return { fromTick, toTick }
}

const baseContext: NoteStreamContext = {
  timebase: 480,
  measures: [{ tick: 0, measure: 1, numerator: 4, denominator: 4 }],
}

describe("set-notes selection range", () => {
  it("uses selection metadata from upstream when no explicit --from/--to", () => {
    const context: NoteStreamContext = {
      ...baseContext,
      selection: { fromTick: 0, toTick: 1920 },
    }
    const range = computeRemoveRange(context, {})
    expect(range).toEqual({ fromTick: 0, toTick: 1920 })
  })

  it("defaults to full range when no selection and no options", () => {
    const range = computeRemoveRange(baseContext, {})
    expect(range).toEqual({ fromTick: 0, toTick: Number.POSITIVE_INFINITY })
  })

  it("explicit --from/--to overrides selection metadata", () => {
    const context: NoteStreamContext = {
      ...baseContext,
      selection: { fromTick: 0, toTick: 1920 },
    }
    const range = computeRemoveRange(context, { from: 480, to: 960 })
    expect(range).toEqual({ fromTick: 480, toTick: 960 })
  })

  it("explicit --from overrides selection fromTick but keeps selection toTick", () => {
    const context: NoteStreamContext = {
      ...baseContext,
      selection: { fromTick: 0, toTick: 1920 },
    }
    const range = computeRemoveRange(context, { from: 480 })
    expect(range).toEqual({ fromTick: 480, toTick: 1920 })
  })

  it("explicit --to overrides selection toTick but keeps selection fromTick", () => {
    const context: NoteStreamContext = {
      ...baseContext,
      selection: { fromTick: 0, toTick: 1920 },
    }
    const range = computeRemoveRange(context, { to: 960 })
    expect(range).toEqual({ fromTick: 0, toTick: 960 })
  })

  it("only removes notes in the selection range, preserving others", () => {
    const existingNotes: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
      { tick: 480, duration: 480, noteNumber: 64, velocity: 100 },
      { tick: 960, duration: 480, noteNumber: 67, velocity: 100 },
      { tick: 1440, duration: 480, noteNumber: 72, velocity: 100 },
      { tick: 1920, duration: 480, noteNumber: 76, velocity: 100 },
    ]

    const context: NoteStreamContext = {
      ...baseContext,
      selection: { fromTick: 0, toTick: 1920 },
    }

    const { fromTick, toTick } = computeRemoveRange(context, {})

    // Simulate: remove notes in range, then add new notes
    const kept = existingNotes.filter(
      (n) => n.tick < fromTick || n.tick >= toTick,
    )
    const newNotes: SerializedNote[] = [
      { tick: 0, duration: 480, noteNumber: 72, velocity: 100 },
      { tick: 480, duration: 480, noteNumber: 67, velocity: 100 },
    ]

    const final = [...kept, ...newNotes].sort((a, b) => a.tick - b.tick)

    // Notes at tick 1920 should be preserved (outside selection range)
    const noteAt1920 = final.find((n) => n.tick === 1920)
    expect(noteAt1920).toBeDefined()
    expect(noteAt1920?.noteNumber).toBe(76)

    // The new notes should be present
    expect(final.filter((n) => n.tick === 0)).toHaveLength(1)
    expect(final.filter((n) => n.tick === 480)).toHaveLength(1)
  })
})
