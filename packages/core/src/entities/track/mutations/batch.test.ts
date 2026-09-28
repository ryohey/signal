import { describe, expect, it } from "vitest"
import { NoteEvent } from "../../event/TrackEvent"
import { emptyTrack } from "../TrackFactory"
import { batchUpdateNotesVelocity } from "./batch"

describe("track mutations/batch", () => {
  it("batchUpdateNotesVelocity applies operation and clamps velocity", () => {
    const track = emptyTrack(0)
    const first = track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })
    const second = track.addEvent<NoteEvent>({
      type: "channel",
      subtype: "note",
      tick: 20,
      duration: 20,
      noteNumber: 62,
      velocity: 120,
    })

    batchUpdateNotesVelocity(track)([first.id, second.id], {
      type: "add",
      value: 20,
    })

    const updatedFirst = track.getEventById(first.id) as NoteEvent | undefined
    const updatedSecond = track.getEventById(second.id) as NoteEvent | undefined

    expect(updatedFirst?.velocity).toBe(120)
    expect(updatedSecond?.velocity).toBe(127)
  })
})
