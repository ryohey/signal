import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { NoteEvent, TrackEvent } from "../../event/TrackEvent"
import { addEvent } from "../mutations"
import { getNoteIdsInSelection } from "./note"

describe("track queries/note", () => {
  it("getNoteIdsInSelection should select notes by tick and note ranges", () => {
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
      tick: 35,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })(events)

    addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 15,
      duration: 10,
      noteNumber: 65,
      velocity: 100,
    })(events)

    const noteIds = getNoteIdsInSelection({
      fromTick: 0,
      toTick: 30,
      fromNoteNumber: 61,
      toNoteNumber: 59,
    })(events)

    expect(noteIds).toStrictEqual([first.id])
  })
})
