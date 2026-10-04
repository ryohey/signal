import { describe, expect, it } from "vitest"
import { createTrackNoteMapper } from "../testUtils"
import {
  addNotes,
  cloneNotes,
  duplicateNotes,
  quantizeNotes,
  removeNotes,
  transposeNotes,
  updateNotes,
} from "./mutations"

describe("mutations", () => {
  it("addNotes adds every note in the batch", () => {
    const editor = createTrackNoteMapper()

    const added = addNotes(editor)([
      { tick: 10, duration: 10, noteNumber: 60, velocity: 100 },
      { tick: 20, duration: 10, noteNumber: 62, velocity: 100 },
    ])

    expect(added).toHaveLength(2)
    expect(editor.getAllNotes()).toMatchObject([
      { tick: 10, noteNumber: 60 },
      { tick: 20, noteNumber: 62 },
    ])
  })

  it("updateNotes applies each note's own update", () => {
    const editor = createTrackNoteMapper()
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

    updateNotes(editor)([
      { ...first, velocity: 50 },
      { ...second, velocity: 90 },
    ])

    expect(editor.getNoteById(first.id)?.velocity).toBe(50)
    expect(editor.getNoteById(second.id)?.velocity).toBe(90)
  })

  it("transposeNotes shifts the pitch of selected notes", () => {
    const editor = createTrackNoteMapper()
    const selected = editor.addNote({
      tick: 10,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })
    const untouched = editor.addNote({
      tick: 20,
      duration: 10,
      noteNumber: 62,
      velocity: 100,
    })

    transposeNotes([selected.id], 5)(editor)

    expect(editor.getNoteById(selected.id)?.noteNumber).toBe(65)
    expect(editor.getNoteById(untouched.id)?.noteNumber).toBe(62)
  })

  it("cloneNotes copies selected notes in place with new ids", () => {
    const editor = createTrackNoteMapper()
    const original = editor.addNote({
      tick: 10,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })

    const clonedIds = cloneNotes([original.id])(editor)

    expect(clonedIds).toHaveLength(1)
    expect(clonedIds[0]).not.toBe(original.id)
    expect(editor.getNoteById(clonedIds[0])).toMatchObject({
      tick: 10,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })
    expect(editor.getAllNotes()).toHaveLength(2)
  })

  it("removeNotes removes every selected note", () => {
    const editor = createTrackNoteMapper()
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

    removeNotes([first.id])(editor)

    expect(editor.getAllNotes()).toMatchObject([{ id: second.id }])
  })

  it("duplicateNotes uses selection span when initialDeltaTick is zero", () => {
    const editor = createTrackNoteMapper()
    const first = editor.addNote({
      tick: 10,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })
    const second = editor.addNote({
      tick: 30,
      duration: 10,
      noteNumber: 62,
      velocity: 100,
    })

    const result = duplicateNotes([first.id, second.id], 0)(editor)

    expect(result.deltaTick).toBe(20)
    expect(result.addedNoteIds).toHaveLength(2)

    const addedTicks = result.addedNoteIds
      .map((id) => editor.getNoteById(id)?.tick)
      .sort((a, b) => (a ?? 0) - (b ?? 0))

    expect(addedTicks).toStrictEqual([30, 50])
  })

  it("quantizeNotes snaps a note's tick to the given rounding", () => {
    const editor = createTrackNoteMapper()
    const note = editor.addNote({
      tick: 13,
      duration: 10,
      noteNumber: 60,
      velocity: 100,
    })

    quantizeNotes([note.id], (tick) => Math.floor(tick / 10) * 10)(editor)

    expect(editor.getNoteById(note.id)?.tick).toBe(10)
  })
})
