import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { NoteEvent, TrackEvent } from "../../event/TrackEvent"
import { addEvent, removeEvent, updateEvent } from "./primitives"

describe("track mutations/primitives", () => {
  it("addEvent should create a note event", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const created = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })(events)

    expect(created.tick).toBe(123)
    expect(created.duration).toBe(120)
    expect(created.velocity).toBe(100)
    expect(created.noteNumber).toBe(100)
  })

  it("updateEvent should update an existing note event", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const created = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 123,
      velocity: 100,
      noteNumber: 100,
    })(events)

    updateEvent<NoteEvent>(created.id, {
      tick: 456,
      duration: 789,
      velocity: 50,
      noteNumber: 200,
    })(events)

    const updated = events.get(created.id) as NoteEvent | undefined
    expect(updated).toBeDefined()
    expect(updated?.tick).toBe(456)
    expect(updated?.duration).toBe(789)
    expect(updated?.velocity).toBe(50)
    expect(updated?.noteNumber).toBe(200)
  })

  it("removeEvent should remove a single event by id", () => {
    const events = new TickOrderedArray<TrackEvent>()

    const created = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      duration: 120,
      tick: 64,
      velocity: 90,
      noteNumber: 72,
    })(events)

    removeEvent(created.id)(events)

    expect(events.get(created.id)).toBeUndefined()
  })
})
