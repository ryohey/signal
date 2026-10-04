import { isNoteEvent } from "@signal-app/core"
import { describe, expect, it } from "vitest"
import { getEventIdsInSelection } from "../queries/items"
import {
  addControllerToTrack,
  addNoteToTrack,
  createSongArrangeEditor,
} from "../testUtils"
import {
  batchUpdateSelectionVelocity,
  duplicateSelection,
  moveEvents,
  pasteEventsAt,
  removeSelection,
  transposeSelection,
} from "./composed"

const selection = {
  fromTick: 0,
  toTick: 50,
  fromTrackIndex: 0,
  toTrackIndex: 1,
}

describe("mutations/composed", () => {
  it("moveEvents shifts notes and controllers alike within the same track", () => {
    const { editor, tracks } = createSongArrangeEditor(1)
    addNoteToTrack(tracks[0], { tick: 10 })
    addControllerToTrack(tracks[0], { tick: 20 })
    const ids = getEventIdsInSelection(selection)(editor)

    moveEvents(ids, { tick: 5, trackIndex: 0 })(editor)

    expect(
      tracks[0].events.map((e) => e.tick).sort((a, b) => a - b),
    ).toStrictEqual([15, 25])
  })

  it("moveEvents carries controllers to the destination track", () => {
    const { editor, tracks } = createSongArrangeEditor(2)
    addNoteToTrack(tracks[0], { tick: 10 })
    addControllerToTrack(tracks[0], { tick: 20 })
    const ids = getEventIdsInSelection(selection)(editor)

    const movedIds = moveEvents(ids, { tick: 0, trackIndex: 1 })(editor)

    expect(tracks[0].events).toHaveLength(0)
    expect(tracks[1].events).toHaveLength(2)
    expect(tracks[1].events.some((e) => !isNoteEvent(e))).toBe(true)
    expect(movedIds[1]).toHaveLength(2)
  })

  it("duplicateSelection copies every event type, shifted by the selection span", () => {
    const { editor, tracks } = createSongArrangeEditor(1)
    addNoteToTrack(tracks[0], { tick: 10 })
    addControllerToTrack(tracks[0], { tick: 20 })

    const newSelection = duplicateSelection(selection)(editor)

    expect(tracks[0].events).toHaveLength(4)
    expect(
      tracks[0].events.map((e) => e.tick).sort((a, b) => a - b),
    ).toStrictEqual([10, 20, 60, 70])
    expect(newSelection).toStrictEqual({
      fromTick: 50,
      toTick: 100,
      fromTrackIndex: 0,
      toTrackIndex: 1,
    })
  })

  it("removeSelection removes every event type in range, leaving those outside", () => {
    const { editor, tracks } = createSongArrangeEditor(1)
    addNoteToTrack(tracks[0], { tick: 10 })
    addControllerToTrack(tracks[0], { tick: 20 })
    addControllerToTrack(tracks[0], { tick: 999 })

    removeSelection(selection)(editor)

    expect(tracks[0].events.map((e) => e.tick)).toStrictEqual([999])
  })

  it("transposeSelection shifts notes and leaves controllers untouched", () => {
    const { editor, tracks } = createSongArrangeEditor(1)
    addNoteToTrack(tracks[0], { tick: 10, noteNumber: 60 })
    const controller = addControllerToTrack(tracks[0], { tick: 20, value: 64 })

    transposeSelection(selection, 5)(editor)

    const note = tracks[0].events.find(isNoteEvent)
    expect(note?.noteNumber).toBe(65)
    const after = tracks[0].events.find((e) => e.id === controller.id)
    expect(after).toMatchObject({ tick: 20, value: 64 })
  })

  it("batchUpdateSelectionVelocity updates notes and leaves controllers untouched", () => {
    const { editor, tracks } = createSongArrangeEditor(1)
    addNoteToTrack(tracks[0], { tick: 10 })
    const controller = addControllerToTrack(tracks[0], { tick: 20, value: 64 })

    batchUpdateSelectionVelocity(selection, { type: "set", value: 42 })(editor)

    expect(tracks[0].events.find(isNoteEvent)?.velocity).toBe(42)
    expect(tracks[0].events.find((e) => e.id === controller.id)).toMatchObject({
      value: 64,
    })
  })

  it("pasteEventsAt restores every event type at the target position", () => {
    const { editor: source, tracks: sourceTracks } = createSongArrangeEditor(1)
    addNoteToTrack(sourceTracks[0], { tick: 10 })
    addControllerToTrack(sourceTracks[0], { tick: 20 })
    const data = getEventIdsInSelection(selection)(source) && {
      type: "arrange_events" as const,
      selectedTrackIndex: 0,
      events: { 0: [...sourceTracks[0].events] },
    }

    const { editor, tracks } = createSongArrangeEditor(1)
    pasteEventsAt(data, 100, 0)(editor)

    expect(tracks[0].events).toHaveLength(2)
    expect(
      tracks[0].events.map((e) => e.tick).sort((a, b) => a - b),
    ).toStrictEqual([110, 120])
    expect(tracks[0].events.some((e) => !isNoteEvent(e))).toBe(true)
  })

  it("pasteEventsAt skips tracks past the end of the song", () => {
    const { editor, tracks } = createSongArrangeEditor(1)

    pasteEventsAt(
      {
        type: "arrange_events",
        selectedTrackIndex: 0,
        events: {
          5: [
            {
              id: 1,
              type: "channel",
              subtype: "note",
              tick: 0,
              duration: 10,
              noteNumber: 60,
              velocity: 100,
            },
          ],
        },
      },
      0,
      -1,
    )(editor)

    expect(tracks[0].events).toHaveLength(0)
  })
})
