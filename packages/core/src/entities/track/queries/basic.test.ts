import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { NoteEvent, TrackEvent } from "../../event/TrackEvent"
import { addEvent } from "../mutations"
import { getAll } from "./basic"

describe("track queries/basic", () => {
  it("getAll returns all events in track order", () => {
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
      tick: 30,
      duration: 10,
      noteNumber: 62,
      velocity: 100,
    })(events)

    const result = getAll(events)

    expect(result.map((event) => event.id)).toStrictEqual([first.id, second.id])
  })
})
