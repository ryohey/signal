import { describe, expect, it } from "vitest"
import type { NoteStreamContext, SerializedNote } from "../../src/types.js"

// Re-implement get-notes filtering + selection logic for isolated testing

function getNotes(
  notes: SerializedNote[],
  context: NoteStreamContext,
  options: { from?: number; to?: number },
): { notes: SerializedNote[]; context: NoteStreamContext } {
  let filtered = notes

  let fromTick: number | undefined
  let toTick: number | undefined

  if (options.from !== undefined) {
    fromTick = options.from
    const ft = fromTick
    filtered = filtered.filter((n) => n.tick >= ft)
  }

  if (options.to !== undefined) {
    toTick = options.to
    const tt = toTick
    filtered = filtered.filter((n) => n.tick < tt)
  }

  const selection =
    fromTick !== undefined || toTick !== undefined
      ? {
          fromTick: fromTick ?? 0,
          toTick: toTick ?? Number.POSITIVE_INFINITY,
        }
      : context.selection

  return { notes: filtered, context: { ...context, selection } }
}

const baseContext: NoteStreamContext = {
  timebase: 480,
  measures: [{ tick: 0, measure: 1, numerator: 4, denominator: 4 }],
}

const allNotes: SerializedNote[] = [
  { tick: 0, duration: 480, noteNumber: 60, velocity: 100 },
  { tick: 480, duration: 480, noteNumber: 64, velocity: 100 },
  { tick: 960, duration: 480, noteNumber: 67, velocity: 100 },
  { tick: 1440, duration: 480, noteNumber: 72, velocity: 100 },
  { tick: 1920, duration: 480, noteNumber: 76, velocity: 100 },
]

describe("get-notes selection propagation", () => {
  it("sets selection.fromTick and selection.toTick when both --from and --to are used", () => {
    const result = getNotes(allNotes, baseContext, { from: 480, to: 1440 })
    expect(result.notes).toHaveLength(2)
    expect(result.context.selection).toEqual({ fromTick: 480, toTick: 1440 })
  })

  it("sets selection with fromTick=0 when only --to is used", () => {
    const result = getNotes(allNotes, baseContext, { to: 960 })
    expect(result.notes).toHaveLength(2)
    expect(result.context.selection).toEqual({
      fromTick: 0,
      toTick: 960,
    })
  })

  it("sets selection with toTick=Infinity when only --from is used", () => {
    const result = getNotes(allNotes, baseContext, { from: 960 })
    expect(result.notes).toHaveLength(3)
    expect(result.context.selection).toEqual({
      fromTick: 960,
      toTick: Number.POSITIVE_INFINITY,
    })
  })

  it("does not set selection when no --from or --to is used", () => {
    const result = getNotes(allNotes, baseContext, {})
    expect(result.notes).toHaveLength(5)
    expect(result.context.selection).toBeUndefined()
  })

  it("preserves upstream selection when no --from or --to is used", () => {
    const contextWithSelection: NoteStreamContext = {
      ...baseContext,
      selection: { fromTick: 100, toTick: 200 },
    }
    const result = getNotes(allNotes, contextWithSelection, {})
    expect(result.context.selection).toEqual({ fromTick: 100, toTick: 200 })
  })
})
