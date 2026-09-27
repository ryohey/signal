import { isNoteEvent } from "@signal-app/core"
import { describe, expect, it } from "vitest"
import {
  addControllerToTrack,
  addNoteToTrack,
  createSongArrangeEditor,
} from "../testUtils"
import {
  getEventIdsInSelection,
  getEventsClipboardData,
  hasEventsInSelection,
  listNotes,
} from "./items"

const selection = {
  fromTick: 0,
  toTick: 50,
  fromTrackIndex: 0,
  toTrackIndex: 1,
}

describe("queries/items", () => {
  it("listNotes lists only notes, across every track", () => {
    const { editor, tracks } = createSongArrangeEditor(2)
    addNoteToTrack(tracks[0], { tick: 10 })
    addControllerToTrack(tracks[0], { tick: 15 })
    addNoteToTrack(tracks[1], { tick: 20 })

    const notes = listNotes(editor)
    expect(notes).toHaveLength(2)
    expect(notes.map((n) => n.tick).sort((a, b) => a - b)).toStrictEqual([
      10, 20,
    ])
  })

  it("getEventIdsInSelection includes non-note events in the range", () => {
    const { editor, tracks } = createSongArrangeEditor(1)
    const note = addNoteToTrack(tracks[0], { tick: 10 })
    const controller = addControllerToTrack(tracks[0], { tick: 20 })
    addControllerToTrack(tracks[0], { tick: 999 }) // outside the range

    const ids = getEventIdsInSelection(selection)(editor)

    expect(ids[0].sort()).toStrictEqual([note.id, controller.id].sort())
  })

  it("hasEventsInSelection is true for a range holding only a controller", () => {
    const { editor, tracks } = createSongArrangeEditor(1)
    addControllerToTrack(tracks[0], { tick: 20 })

    expect(hasEventsInSelection(selection)(editor)).toBe(true)
  })

  it("getEventsClipboardData copies every event type, normalized to the selection start", () => {
    const { editor, tracks } = createSongArrangeEditor(1)
    addNoteToTrack(tracks[0], { tick: 30 })
    addControllerToTrack(tracks[0], { tick: 40 })

    const data = getEventsClipboardData({
      ...selection,
      fromTick: 20,
      toTick: 50,
    })(editor)

    expect(data.type).toBe("arrange_events")
    expect(data.selectedTrackIndex).toBe(0)
    const copied = data.events[0]
    expect(copied).toHaveLength(2)
    expect(copied.map((e) => e.tick).sort((a, b) => a - b)).toStrictEqual([
      10, 20,
    ])
    expect(copied.some((e) => !isNoteEvent(e))).toBe(true)
  })
})
