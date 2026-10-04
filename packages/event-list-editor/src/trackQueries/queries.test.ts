import { type NoteEvent, Track } from "@signal-app/core"
import { describe, expect, it } from "vitest"
import { getEventsByIdsOrAll } from "./queries"

const newTrack = () => {
  const track = new Track()
  // A fresh Track defaults to being the channel-less conductor track, which
  // drops "channel"-type events (including notes).
  track.channel = 0
  return track
}

const addNote = (track: Track, tick: number, noteNumber: number) =>
  track.addEvent<NoteEvent>({
    type: "channel",
    subtype: "note",
    tick,
    duration: 10,
    noteNumber,
    velocity: 100,
  })

describe("trackQueries/queries", () => {
  it("getEventsByIdsOrAll returns all events when ids is empty", () => {
    const track = newTrack()
    const first = addNote(track, 10, 60)
    const second = addNote(track, 30, 62)

    const result = getEventsByIdsOrAll([])(track)

    expect(result.map((event) => event.id)).toStrictEqual([first.id, second.id])
  })

  it("getEventsByIdsOrAll filters by ids in track order", () => {
    const track = newTrack()
    const first = addNote(track, 10, 60)
    const second = addNote(track, 30, 62)
    const third = addNote(track, 50, 64)

    const result = getEventsByIdsOrAll([third.id, first.id])(track)

    expect(result.map((event) => event.id)).toStrictEqual([first.id, third.id])
    expect(result.some((event) => event.id === second.id)).toBe(false)
  })
})
