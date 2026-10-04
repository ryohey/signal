import { describe, expect, it } from "vitest"
import { createTrackNoteMapper } from "../testUtils"
import { getNotesClipboardData } from "./clipboard"

describe("clipboard queries", () => {
  it("getNotesClipboardData returns selected notes relative to the first tick", () => {
    const editor = createTrackNoteMapper()
    const first = editor.addNote({
      tick: 10,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })
    const second = editor.addNote({
      tick: 30,
      duration: 5,
      noteNumber: 62,
      velocity: 90,
    })

    const data = getNotesClipboardData([first.id, second.id])(editor)

    expect(data).toMatchObject({
      type: "piano_notes",
      notes: [
        { tick: 0, duration: 10, noteNumber: 60, velocity: 100 },
        { tick: 20, duration: 5, noteNumber: 62, velocity: 90 },
      ],
    })
  })

  it("getNotesClipboardData returns null when no notes are selected", () => {
    const editor = createTrackNoteMapper()

    expect(getNotesClipboardData([])(editor)).toBeNull()
  })
})
