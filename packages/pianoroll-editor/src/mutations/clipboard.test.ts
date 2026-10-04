import { describe, expect, it } from "vitest"
import { createTrackNoteMapper } from "../testUtils"
import { addClipboardNotes } from "./clipboard"

describe("clipboard mutations", () => {
  it("addClipboardNotes adds pasted notes shifted to the target tick", () => {
    const editor = createTrackNoteMapper()

    addClipboardNotes(
      {
        type: "piano_notes",
        notes: [{ tick: 0, duration: 5, noteNumber: 70, velocity: 90 }],
      },
      40,
    )(editor)

    expect(editor.getAllNotes()).toMatchObject([
      { tick: 40, duration: 5, noteNumber: 70, velocity: 90 },
    ])
  })
})
