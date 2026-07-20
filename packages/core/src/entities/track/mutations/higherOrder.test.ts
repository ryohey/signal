import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { NoteEvent, TrackEvent } from "../../event/TrackEvent"
import { addEvent, updateEvent } from "./basic"
import { combineMutators } from "./higherOrder"

describe("track mutations/higherOrder", () => {
  it("combineMutators executes mutators in order and returns each result", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const first = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })(events)

    const result = combineMutators(
      updateEvent<NoteEvent>(first.id, { velocity: 80 }),
      addEvent<NoteEvent>({
        type: "channel",
        subtype: "note",
        tick: 30,
        duration: 10,
        noteNumber: 64,
        velocity: 90,
      }),
    )(events)

    expect(result).toHaveLength(2)

    const updated = events.get(first.id) as NoteEvent | undefined
    expect(updated?.velocity).toBe(80)
    expect(events.getArray().length).toBe(2)
  })
})
