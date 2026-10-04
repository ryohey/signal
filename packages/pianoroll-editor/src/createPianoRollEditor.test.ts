import { Song, Track } from "@signal-app/core"
import { describe, expect, it, vi } from "vitest"
import { createPianoRollEditor } from "./createPianoRollEditor"

const newSongWithTrack = () => {
  const song = new Song()
  const track = new Track()
  // A song's first-ever track defaults to being the channel-less conductor
  // track, which silently drops "channel"-type events (including notes).
  track.channel = 0
  song.addTrack(track)
  return { song, track }
}

describe("createPianoRollEditor", () => {
  it("runs a composed mutation in one transaction, emitting a single change", () => {
    const { song, track } = newSongWithTrack()
    const editor = createPianoRollEditor(song, track.id)
    const first = editor.addNote({
      tick: 10,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })
    const second = editor.addNote({
      tick: 20,
      duration: 10,
      noteNumber: 62,
      velocity: 100,
    })

    const listener = vi.fn()
    track.onEventsChanged.subscribe(listener)

    // removes two notes; without a transaction this would notify twice
    editor.removeNotes([first.id, second.id])

    expect(editor.getAllNoteIds()).toStrictEqual([])
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
