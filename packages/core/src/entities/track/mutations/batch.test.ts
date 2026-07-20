import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { NoteEvent, TrackEvent } from "../../event/TrackEvent"
import { addEvent } from "./basic"
import { batchUpdateNotesVelocity } from "./batch"

describe("track mutations/batch", () => {
  it("batchUpdateNotesVelocity applies operation and clamps velocity", () => {
    const events = new TickOrderedArray<TrackEvent>()
    const first = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })(events)
    const second = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 20,
      duration: 20,
      noteNumber: 62,
      velocity: 120,
    })(events)

    batchUpdateNotesVelocity([first.id, second.id], { type: "add", value: 20 })(
      events,
    )

    const updatedFirst = events.get(first.id) as NoteEvent | undefined
    const updatedSecond = events.get(second.id) as NoteEvent | undefined

    expect(updatedFirst?.velocity).toBe(120)
    expect(updatedSecond?.velocity).toBe(127)
  })
})
