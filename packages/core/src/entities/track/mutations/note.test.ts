import { describe, expect, it } from "vitest"
import { TickOrderedArray } from "../../../data/OrdererdArray/TickOrderedArray"
import { isNoteEvent } from "../../event/identify"
import { NoteEvent, TrackEvent } from "../../event/TrackEvent"
import { addEvent } from "./basic"
import { addClipboardNotes, duplicateNotes, quantizeNotes } from "./note"

describe("track mutations/note", () => {
  it("duplicateNotes uses selection span when initialDeltaTick is zero", () => {
    const events = new TickOrderedArray<TrackEvent>()
    const first = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 10,
      duration: 10,
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

    const result = duplicateNotes([first.id, second.id], 0)(events)

    expect(result.deltaTick).toBe(20)
    expect(result.addedNoteIds).toHaveLength(2)

    const addedTicks = result.addedNoteIds
      .map((id) => events.get(id))
      .filter(
        (event): event is NoteEvent =>
          event !== undefined && isNoteEvent(event),
      )
      .map((event) => event.tick)
      .sort((a, b) => a - b)

    expect(addedTicks).toStrictEqual([30, 50])
  })

  it("quantizeNotes and addClipboardNotes update note ticks", () => {
    const events = new TickOrderedArray<TrackEvent>()
    const note = addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 13,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })(events)

    quantizeNotes([note.id], (tick) => Math.floor(tick / 10) * 10)(events)

    addClipboardNotes(
      {
        type: "piano_notes",
        notes: [
          {
            type: "channel",
            subtype: "note",
            tick: 0,
            duration: 5,
            noteNumber: 70,
            velocity: 90,
          },
        ],
      },
      40,
    )(events)

    const allNotes = events.getArray().filter(isNoteEvent)
    expect(
      allNotes.some((event) => event.tick === 10 && event.id === note.id),
    ).toBe(true)
    expect(
      allNotes.some((event) => event.tick === 40 && event.noteNumber === 70),
    ).toBe(true)
  })
})
