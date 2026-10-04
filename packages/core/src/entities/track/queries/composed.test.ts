import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import type { NoteEvent, TrackEvent } from "../../event/TrackEvent"
import { addEvent } from "../mutations"
import { getEventsByIds } from "./composed"

describe("track queries/composed", () => {
  it("getEventsByIds returns only matched events", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const first = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })(events)
    addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 30,
      duration: 10,
      noteNumber: 62,
      velocity: 100,
    })(events)

    const result = getEventsByIds([first.id])(events)

    expect(result.map((event) => event.id)).toStrictEqual([first.id])
  })
})
