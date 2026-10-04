import type { ProgramChangeEvent } from "midifile-ts"
import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { isProgramChangeEvent } from "../../event/identify"
import type { TrackEvent, TrackEventOf } from "../../event/TrackEvent"
import { addEvent } from "./primitives"
import {
  insertProgramChangeAt,
  setProgramNumberAt,
  setProgramNumberById,
} from "./program"

describe("track mutations/program", () => {
  it("setProgramNumberAt updates last event at or before target tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const existing = addEvent<TrackEventOf<ProgramChangeEvent>>({
      type: "channel",
      subtype: "programChange",
      tick: 20,
      value: 1,
    })(events)
    addEvent<TrackEventOf<ProgramChangeEvent>>({
      type: "channel",
      subtype: "programChange",
      tick: 80,
      value: 5,
    })(events)

    const result = setProgramNumberAt(50, 9)(events)
    const updated = events.get(existing.id)

    expect(result?.id).toBe(existing.id)
    expect(
      updated && isProgramChangeEvent(updated) ? updated.value : null,
    ).toBe(9)
  })

  it("setProgramNumberAt creates event at tick 0 when no event exists before tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    addEvent<TrackEventOf<ProgramChangeEvent>>({
      type: "channel",
      subtype: "programChange",
      tick: 80,
      value: 5,
    })(events)

    const result = setProgramNumberAt(50, 9)(events)

    expect(result).toBeDefined()
    expect(result?.tick).toBe(0)
    expect(result?.value).toBe(9)
  })

  it("insertProgramChangeAt adds event at tick without updating existing ones", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const existing = addEvent<TrackEventOf<ProgramChangeEvent>>({
      type: "channel",
      subtype: "programChange",
      tick: 20,
      value: 1,
    })(events)

    const result = insertProgramChangeAt(50, 9)(events)
    const unchanged = events.get(existing.id)

    expect(result.id).not.toBe(existing.id)
    expect(result.tick).toBe(50)
    expect(result.value).toBe(9)
    expect(
      unchanged && isProgramChangeEvent(unchanged) ? unchanged.value : null,
    ).toBe(1)
  })

  it("setProgramNumberById updates specified event", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const existing = addEvent<TrackEventOf<ProgramChangeEvent>>({
      type: "channel",
      subtype: "programChange",
      tick: 20,
      value: 1,
    })(events)

    const result = setProgramNumberById(existing.id, 11)(events)
    const updated = events.get(existing.id)

    expect(result?.id).toBe(existing.id)
    expect(
      updated && isProgramChangeEvent(updated) ? updated.value : null,
    ).toBe(11)
  })
})
