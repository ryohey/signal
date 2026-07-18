import { flow, min } from "lodash"
import { filter, map } from "../../../helpers"
import { PianoNotesClipboardData } from "../../clipboard/clipboardTypes"
import { isNoteEvent, NoteEvent } from "../../event"
import { Range } from "../../geometry/Range"
import { isNoteInRange, sortedNotes } from "../../note"
import { getEventsByIds, TrackEventsQuery } from "./basic"

export type NoteSelection = {
  readonly fromTick: number
  readonly toTick: number
  readonly fromNoteNumber: number
  readonly toNoteNumber: number
}

export const getNotesByIds = (
  ids: readonly number[],
): TrackEventsQuery<readonly NoteEvent[]> =>
  flow(getEventsByIds(ids), filter(isNoteEvent))

export const notesToClipboardData =
  (
    noteIds: readonly number[],
    startTick?: number,
  ): TrackEventsQuery<PianoNotesClipboardData | null> =>
  (events) => {
    const notes = getNotesByIds(noteIds)(events)

    const minTick = startTick ?? min(notes.map((e) => e.tick))

    if (minTick === undefined) {
      return null
    }

    return {
      type: "piano_notes",
      notes: notes.map((e) => ({ ...e, tick: e.tick - minTick })),
    }
  }

const getAllNotes = (): TrackEventsQuery<readonly NoteEvent[]> =>
  flow((events) => events.getArray(), filter(isNoteEvent))

export const getAllNoteIds = (): TrackEventsQuery<readonly number[]> =>
  flow(
    getAllNotes(),
    map((e) => e.id),
  )

const getNotesInSelection = (
  selection: NoteSelection,
): TrackEventsQuery<readonly NoteEvent[]> => {
  const tickRange = Range.create(selection.fromTick, selection.toTick)
  const noteNumberRange = Range.create(
    selection.toNoteNumber,
    selection.fromNoteNumber,
  )
  const isEventInRange = isNoteInRange(tickRange, noteNumberRange)

  return flow(getAllNotes(), filter(isEventInRange))
}

export const getNoteIdsInSelection = (
  selection: NoteSelection,
): TrackEventsQuery<readonly number[]> =>
  flow(
    getNotesInSelection(selection),
    map((e) => e.id),
  )

export const getNeighborNote =
  (
    deltaIndex: number,
    selectedNoteIds: readonly number[],
  ): TrackEventsQuery<NoteEvent | null> =>
  (events) => {
    if (selectedNoteIds.length === 0) {
      return null
    }
    const allNotes = events.getArray().filter(isNoteEvent)
    const selectedNotes = sortedNotes(getNotesByIds(selectedNoteIds)(events))
    if (selectedNotes.length === 0) {
      return null
    }
    const firstNote = sortedNotes(selectedNotes)[0]
    const notes = sortedNotes(allNotes)
    const currentIndex = notes.findIndex((n) => n.id === firstNote.id)
    const nextNote = notes[currentIndex + deltaIndex]
    return nextNote ?? null
  }
