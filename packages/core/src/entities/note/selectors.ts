import { maxBy, minBy } from "lodash"
import { NoteEvent } from "../event"
import { Range } from "../geometry/Range"

export const getNotesDuration = (notes: readonly NoteEvent[]) => {
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
