import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { NoteEvent, TrackEvent } from "../../event/TrackEvent"
import { addEvent } from "../mutations"
import { getDraggableArea, getDraggablePosition } from "./draggable"

describe("track queries/draggable", () => {
  it("getDraggablePosition returns right edge for right handle", () => {
    const events = new TickOrderedArray<TrackEvent>()
    const note = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })(events)

    const result = getDraggablePosition(note.id, "right")(events)

    expect(result).toStrictEqual({ tick: 30, noteNumber: 60 })
  })

  it("getDraggableArea returns center move ranges based on selected notes", () => {
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
      duration: 20,
      noteNumber: 72,
      velocity: 100,
    })(events)

    const area = getDraggableArea(
      first.id,
      [first.id, second.id],
      "center",
    )(events)

    expect(area?.tickRange).toStrictEqual([0, Infinity])
    expect(area?.noteNumberRange).toStrictEqual([0, 115])
  })
})
