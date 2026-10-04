import { describe, expect, it } from "vitest"
import { dragNote, getDraggableArea, getDraggablePosition } from "./draggable"
import { createTrackNoteMapper } from "./testUtils"

describe("draggable", () => {
  it("getDraggablePosition returns right edge for right handle", () => {
    const editor = createTrackNoteMapper()
    const note = editor.addNote({
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })

    const result = getDraggablePosition(note.id, "right")(editor)

    expect(result).toStrictEqual({ tick: 30, noteNumber: 60 })
  })

  it("getDraggableArea returns center move ranges based on selected notes", () => {
    const editor = createTrackNoteMapper()
    const first = editor.addNote({
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })
    const second = editor.addNote({
      tick: 30,
      duration: 20,
      noteNumber: 72,
      velocity: 100,
    })

    const area = getDraggableArea(
      first.id,
      [first.id, second.id],
      "center",
    )(editor)

    expect(area?.tickRange).toStrictEqual([0, Infinity])
    expect(area?.noteNumberRange).toStrictEqual([0, 115])
  })

  it("dragNote updates tick and note number when dragging center", () => {
    const editor = createTrackNoteMapper()
    const note = editor.addNote({
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })

    dragNote({ tick: 15, noteNumber: 62 }, note.id, "center")(editor)

    const updated = editor.getNoteById(note.id)
    expect(updated?.tick).toBe(15)
    expect(updated?.noteNumber).toBe(62)
    expect(updated?.duration).toBe(20)
  })

  it("dragNote updates duration from edge handles", () => {
    const editor = createTrackNoteMapper()
    const note = editor.addNote({
      tick: 10,
      duration: 20,
      noteNumber: 60,
      velocity: 100,
    })

    dragNote({ tick: 6, noteNumber: 60 }, note.id, "left")(editor)
    dragNote({ tick: 40, noteNumber: 60 }, note.id, "right")(editor)

    const updated = editor.getNoteById(note.id)
    expect(updated?.tick).toBe(6)
    expect(updated?.duration).toBe(34)
  })
})
