import { Song, Track } from "@signal-app/core"
import { describe, expect, it, vi } from "vitest"
import { SongArrangeEditor } from "./SongArrangeEditor"
import { addNoteToTrack, createSongArrangeEditor } from "./testUtils"

describe("SongArrangeEditor", () => {
  it("observeItems notifies when a track's events change", () => {
    const { editor, tracks } = createSongArrangeEditor(1)
    const listener = vi.fn()
    const unsubscribe = editor.observeItems(listener)

    addNoteToTrack(tracks[0], { tick: 10 })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    addNoteToTrack(tracks[0], { tick: 20 })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("observeItems notifies on track list changes and follows newly added tracks", () => {
    const song = new Song()
    song.addTrack(new Track())
    const editor = new SongArrangeEditor(song)

    const listener = vi.fn()
    editor.observeItems(listener)

    const newTrack = new Track()
    song.addTrack(newTrack)
    expect(listener).toHaveBeenCalledTimes(1)

    addNoteToTrack(newTrack, { tick: 10 })
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
