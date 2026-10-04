import { type NoteEvent, Track } from "@signal-app/core"
import { describe, expect, it, vi } from "vitest"
import { createVelocityEditor } from "./createVelocityEditor"

const newTrack = () => {
  const track = new Track()
  // A fresh Track defaults to being the channel-less conductor track,
  // which Track.addEvents silently drops "channel"-type events (including
  // notes) on.
  track.channel = 0
  return track
}

describe("createVelocityEditor", () => {
  it("getNotesInRange returns notes overlapping the range", () => {
    const track = newTrack()
    track.addEvents<NoteEvent>([
      {
        type: "channel",
        subtype: "note",
        tick: 10,
        duration: 10,
        noteNumber: 60,
        velocity: 80,
      },
      {
        type: "channel",
        subtype: "note",
        tick: 100,
        duration: 10,
        noteNumber: 62,
        velocity: 90,
      },
    ])

    const editor = createVelocityEditor(track)

    expect(editor.getNotesInRange([0, 50])).toMatchObject([
      { tick: 10, velocity: 80 },
    ])
  })

  it("observeItems notifies when a note changes", () => {
    const track = newTrack()
    const editor = createVelocityEditor(track)

    const listener = vi.fn()
    editor.observeItems(listener)

    track.addEvents<NoteEvent>([
      {
        type: "channel",
        subtype: "note",
        tick: 10,
        duration: 10,
        noteNumber: 60,
        velocity: 80,
      },
    ])

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("setVelocity sets the same velocity on every given note", () => {
    const track = newTrack()
    const [first, second] = track.addEvents<NoteEvent>([
      {
        type: "channel",
        subtype: "note",
        tick: 10,
        duration: 10,
        noteNumber: 60,
        velocity: 80,
      },
      {
        type: "channel",
        subtype: "note",
        tick: 20,
        duration: 10,
        noteNumber: 62,
        velocity: 90,
      },
    ])

    const editor = createVelocityEditor(track)
    editor.setVelocity([first.id, second.id], 42)

    expect(editor.getNotesInRange([0, 100])).toMatchObject([
      { velocity: 42 },
      { velocity: 42 },
    ])
  })

  it("updateVelocityInRange interpolates velocity across the tick range", () => {
    const track = newTrack()
    const [note] = track.addEvents<NoteEvent>([
      {
        type: "channel",
        subtype: "note",
        tick: 50,
        duration: 10,
        noteNumber: 60,
        velocity: 1,
      },
    ])

    const editor = createVelocityEditor(track)
    editor.updateVelocityInRange([note.id], 0, 0, 100, 100)

    expect(editor.getNotesInRange([0, 100])).toMatchObject([{ velocity: 50 }])
  })
})
