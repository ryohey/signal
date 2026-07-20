import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { NoteEvent, TrackEvent } from "../../event/TrackEvent"
import { addEvent } from "./basic"
import { dragNote } from "./draggable"

describe("track mutations/draggable", () => {
  it("dragNote updates tick and note number when dragging center", () => {
    const events = new TickOrderedArray<TrackEvent>()
    const note = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })(events)

    dragNote({ tick: 15, noteNumber: 62 }, note.id, "center")(events)

    const updated = events.get(note.id) as NoteEvent | undefined
    expect(updated?.tick).toBe(15)
    expect(updated?.noteNumber).toBe(62)
    expect(updated?.duration).toBe(20)
  })

  it("dragNote updates duration from edge handles", () => {
    const events = new TickOrderedArray<TrackEvent>()
    const note = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })(events)

    dragNote({ tick: 6 }, note.id, "left")(events)
    dragNote({ tick: 40 }, note.id, "right")(events)

    const updated = events.get(note.id) as NoteEvent | undefined
    expect(updated?.tick).toBe(6)
    expect(updated?.duration).toBe(34)
  })
})
