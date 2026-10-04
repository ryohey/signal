import { MaxNoteNumber, Range } from "@signal-app/core"
import { max, maxBy, min, minBy } from "lodash"
import type { PianoNotesClipboardData } from "../clipboardTypes"
import type { NotePoint } from "../NotePoint"
import type { NoteSelection } from "../NoteSelection"
import type { NoteEvent } from "./NoteEvent"
import { moveEvent, sortedNotes } from "./transform"

export const getNotesDuration = (
  notes: readonly { tick: number; duration: number }[],
) => {
  const minTick = minBy(notes, (n) => n.tick)?.tick ?? 0
  const maxTick = maxBy(notes, (n) => n.tick + n.duration)?.tick ?? 0
  return maxTick - minTick
}

export const isNoteInRange =
  (tickRange: Range, noteNumberRange: Range) => (note: NoteEvent) =>
    Range.intersects(tickRange, Range.fromLength(note.tick, note.duration)) &&
    Range.intersects(
      noteNumberRange,
      // Note pitch corresponds to the lower edge of the 1-semitone-high note area.
      Range.create(note.noteNumber - 1, note.noteNumber),
    )

export const toNotesClipboardData =
  (startTick?: number) =>
  (notes: readonly NoteEvent[]): PianoNotesClipboardData | null => {
    const minTick = startTick ?? min(notes.map((e) => e.tick))

    if (minTick === undefined) {
      return null
    }

    return {
      type: "piano_notes",
      notes: notes.map((e) => ({ ...e, tick: e.tick - minTick })),
    }
  }

export const toId = <T extends { id: number }>(item: T) => item.id

export const duplicatedNotes = (
  selectedNotes: readonly NoteEvent[],
  initialDeltaTick: number,
) => {
  const deltaTick =
    initialDeltaTick === 0 ? getNotesDuration(selectedNotes) : initialDeltaTick
  const notes = selectedNotes.map(moveEvent(deltaTick))

  return {
    notes,
    deltaTick,
  }
}

export const findNeighborNote = (
  deltaIndex: number,
  selectedNotes: readonly NoteEvent[],
  allNotes: readonly NoteEvent[],
): NoteEvent | null => {
  if (selectedNotes.length === 0) {
    return null
  }
  const firstNote = sortedNotes(selectedNotes)[0]
  const notes = sortedNotes(allNotes)
  const currentIndex = notes.findIndex((n) => n.id === firstNote.id)
  const nextNote = notes[currentIndex + deltaIndex]
  return nextNote ?? null
}

export const filterNotesInSelection = (selection: NoteSelection) => {
  const tickRange = Range.create(selection.fromTick, selection.toTick)
  const noteNumberRange = Range.create(
    selection.toNoteNumber,
    selection.fromNoteNumber,
  )
  return isNoteInRange(tickRange, noteNumberRange)
}

export const toDraggablePosition =
  (position: "left" | "center" | "right") =>
  (note: NoteEvent): NotePoint => {
    switch (position) {
      case "center":
        return note
      case "left":
        return note
      case "right":
        return {
          tick: note.tick + note.duration,
          noteNumber: note.noteNumber,
        }
    }
  }

export const toDraggableArea = (
  note: NoteEvent,
  selectedNotes: readonly NoteEvent[],
  position: "left" | "center" | "right",
  minLength: number = 0,
): {
  tickRange: Range
  noteNumberRange: Range
} | null => {
  const minTick = min(selectedNotes.map((n) => n.tick)) ?? 0
  const tickLowerBound = note.tick - minTick
  switch (position) {
    case "center": {
      const maxNoteNumber = max(selectedNotes.map((n) => n.noteNumber)) ?? 0
      const minNoteNumber = min(selectedNotes.map((n) => n.noteNumber)) ?? 0
      const noteNumberLowerBound = note.noteNumber - minNoteNumber
      const noteNumberUpperBound =
        MaxNoteNumber - (maxNoteNumber - note.noteNumber)
      return {
        tickRange: Range.create(tickLowerBound, Infinity),
        noteNumberRange: Range.create(
          noteNumberLowerBound,
          noteNumberUpperBound,
        ),
      }
    }
    case "left":
      return {
        tickRange: Range.create(
          tickLowerBound,
          note.tick + note.duration - minLength,
        ),
        noteNumberRange: Range.point(note.noteNumber), // allow to move only vertically
      }
    case "right":
      return {
        tickRange: Range.create(note.tick + minLength, Infinity),
        noteNumberRange: Range.point(note.noteNumber), // allow to move only vertically
      }
  }
}
