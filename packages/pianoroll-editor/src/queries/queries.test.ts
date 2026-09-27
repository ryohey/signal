import { describe, expect, it } from "vitest"
import { createTrackNoteMapper } from "../testUtils"
import { getNoteIdsInSelection } from "./queries"

describe("queries", () => {
  it("getNoteIdsInSelection should select notes by tick and note ranges", () => {
    const editor = createTrackNoteMapper()

    const first = editor.addNote({
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })

    editor.addNote({
      tick: 35,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })

    editor.addNote({
      tick: 15,
      duration: 10,
      noteNumber: 65,
      velocity: 100,
    })

    const noteIds = getNoteIdsInSelection({
      fromTick: 0,
      toTick: 30,
      fromNoteNumber: 61,
      toNoteNumber: 59,
    })(editor)

    expect(noteIds).toStrictEqual([first.id])
  })
})
