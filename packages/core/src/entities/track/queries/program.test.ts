import { ProgramChangeEvent } from "midifile-ts"
import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { TrackEvent, TrackEventOf } from "../../event/TrackEvent"
import { addEvent } from "../mutations"
import {
  getProgramChangeEventAtOrBefore,
  hasProgramChangeEventAfter,
} from "./program"

describe("track queries/program", () => {
  it("getProgramChangeEventAtOrBefore returns last event at or before tick", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const at10 = addEvent<TrackEventOf<ProgramChangeEvent>>({
      type: "channel",
      subtype: "programChange",
      tick: 10,
      value: 1,
    })(events)
    const at30 = addEvent<TrackEventOf<ProgramChangeEvent>>({
      type: "channel",
      subtype: "programChange",
      tick: 30,
      value: 5,
    })(events)

    const result = getProgramChangeEventAtOrBefore(25)(events)
    expect(result?.id).toBe(at10.id)

    const result2 = getProgramChangeEventAtOrBefore(30)(events)
    expect(result2?.id).toBe(at30.id)
  })

  it("hasProgramChangeEventAfter returns whether a later event exists", () => {
    const events = new TickOrderedArray<TrackEvent>()

    addEvent<TrackEventOf<ProgramChangeEvent>>({
      type: "channel",
      subtype: "programChange",
      tick: 10,
      value: 1,
    })(events)
    addEvent<TrackEventOf<ProgramChangeEvent>>({
      type: "channel",
      subtype: "programChange",
      tick: 30,
      value: 5,
    })(events)

    expect(hasProgramChangeEventAfter(10)(events)).toBe(true)
    expect(hasProgramChangeEventAfter(30)(events)).toBe(false)
  })
})
