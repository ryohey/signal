import { NoteEvent, Track, TrackEventOf, TrackId } from "@signal-app/core"
import { SetTempoEvent } from "midifile-ts"
import { describe, expect, it } from "vitest"
import { getArrangeNotesInTrack } from "./ArrangeNote"

describe("entities/ArrangeNote", () => {
  it("getArrangeNotesInTrack maps notes with track metadata and ignores non-note events", () => {
    const track = new Track()
    track.channel = 0 // a channel-less track is the conductor track, which drops note events

    const [note] = track.addEvents<NoteEvent>([
      {
        type: "channel",
        subtype: "note",
        tick: 10,
        duration: 20,
        noteNumber: 60,
        velocity: 100,
      },
    ])
    track.addEvents<TrackEventOf<SetTempoEvent>>([
      {
        type: "meta",
        subtype: "setTempo",
        tick: 20,
        microsecondsPerBeat: 500000,
      },
    ])

    const trackId = 7 as TrackId
    const trackIndex = 2
    const arrangeNotes = track.query(
      getArrangeNotesInTrack(trackId, trackIndex),
    )

    expect(arrangeNotes.length).toBe(1)
    expect(arrangeNotes[0]).toMatchObject({
      id: note.id,
      tick: 10,
      duration: 20,
      trackId,
      trackIndex,
      event: {
        id: note.id,
      },
    })
  })
})
