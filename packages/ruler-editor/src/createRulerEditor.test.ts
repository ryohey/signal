import { Song, Track } from "@signal-app/core"
import { describe, expect, it, vi } from "vitest"
import { createRulerEditor } from "./createRulerEditor"

const newSong = () => {
  const song = new Song()
  // A song's first track is the conductor track.
  song.addTrack(new Track())
  return song
}

const editorFor = (song: Song) => {
  const { conductorTrack } = song
  if (conductorTrack === undefined) {
    throw new Error("no conductor track")
  }
  return createRulerEditor(song, conductorTrack)
}

describe("createRulerEditor", () => {
  it("addTimeSignature snaps to the start of the measure", () => {
    const song = newSong()
    const editor = editorFor(song)
    const measureTicks = song.timebase * 4

    const added = editor.addTimeSignature(measureTicks + 10, 3, 4)

    expect(added).toMatchObject({
      tick: measureTicks,
      numerator: 3,
      denominator: 4,
    })
    expect(editor.getTimeSignatures()).toMatchObject([
      { tick: measureTicks, numerator: 3, denominator: 4 },
    ])
  })

  it("getTimeSignatures returns the same array until a change", () => {
    const editor = editorFor(newSong())
    const before = editor.getTimeSignatures()

    expect(editor.getTimeSignatures()).toBe(before)

    editor.addTimeSignature(0, 3, 4)
    expect(editor.getTimeSignatures()).not.toBe(before)
  })

  it("addTimeSignature skips a measure that already has one", () => {
    const editor = editorFor(newSong())

    editor.addTimeSignature(0, 3, 4)

    expect(editor.addTimeSignature(0, 6, 8)).toBeNull()
    expect(editor.getTimeSignatures()).toHaveLength(1)
  })

  it("updateTimeSignature and removeTimeSignatures edit existing ones", () => {
    const editor = editorFor(newSong())
    const added = editor.addTimeSignature(0, 3, 4)
    if (added === null) {
      throw new Error("not added")
    }

    editor.updateTimeSignature(added.id, 6, 8)
    expect(editor.getTimeSignatures()).toMatchObject([
      { id: added.id, numerator: 6, denominator: 8 },
    ])

    editor.removeTimeSignatures([added.id])
    expect(editor.getTimeSignatures()).toStrictEqual([])
  })

  it("observeTimeSignatures notifies on changes until unsubscribed", () => {
    const song = newSong()
    const editor = editorFor(song)
    const listener = vi.fn()
    const unsubscribe = editor.observeTimeSignatures(listener)

    editor.addTimeSignature(0, 3, 4)
    expect(listener).toHaveBeenCalled()

    unsubscribe()
    listener.mockClear()
    editor.addTimeSignature(song.timebase * 4 * 4, 5, 4)
    expect(listener).not.toHaveBeenCalled()
  })
})
