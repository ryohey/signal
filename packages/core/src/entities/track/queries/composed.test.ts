import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { NoteEvent, TrackEvent } from "../../event/TrackEvent"
import { addEvent } from "../mutations"
import { getEventsByIds, getEventsByIdsOrAll } from "./composed"

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

  it("getEventsByIdsOrAll returns all events when ids is empty", () => {
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

    const result = getEventsByIdsOrAll([])(events)

    expect(result.map((event) => event.id)).toStrictEqual([first.id, second.id])
  })

  it("getEventsByIdsOrAll filters by ids in track order", () => {
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
    const third = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 50,
      duration: 10,
      noteNumber: 64,
      velocity: 100,
    })(events)

    const result = getEventsByIdsOrAll([third.id, first.id])(events)

    expect(result.map((event) => event.id)).toStrictEqual([first.id, third.id])
    expect(result.some((event) => event.id === second.id)).toBe(false)
  })
})
