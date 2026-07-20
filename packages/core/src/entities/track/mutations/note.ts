import { flow } from "lodash"
import { filter, isEventInRange, map } from "../../../helpers"
import { PianoNotesClipboardData } from "../../clipboard/clipboardTypes"
import { isNoteEvent, moveEvent } from "../../event"
import { TrackEvent } from "../../event/TrackEvent"
import { Range } from "../../geometry/Range"
import { getNotesDuration, quantizeNote, transposeNote } from "../../note"
import { getAll, getNotesByIds } from "../queries"
import { addEvents, updateEvents } from "./composed"
import { TrackEventsMutator } from "./type"

export const transposeNotes =
  (noteIds: readonly number[], deltaPitch: number): TrackEventsMutator =>
  (events) => {
    const transposedNotes = flow(
      getNotesByIds(noteIds),
      map(transposeNote(deltaPitch)),
    )(events)
    return updateEvents(transposedNotes)(events)
  }

// duplicate notes with an optional deltaTick
// if deltaTick is 0, duplicate to the right of the selected notes
export const duplicateNotes =
  (
    noteIds: readonly number[],
    initialDeltaTick: number,
  ): TrackEventsMutator<{ addedNoteIds: number[]; deltaTick: number }> =>
  (events) => {
    const selectedNotes = getNotesByIds(noteIds)(events)

    const deltaTick =
      initialDeltaTick === 0
        ? getNotesDuration(selectedNotes)
        : initialDeltaTick

    const notes = selectedNotes.map(moveEvent(deltaTick))

    const addedNoteIds = addEvents(notes)(events).map((e) => e.id)

    return { addedNoteIds, deltaTick }
  }

export const cloneNotes =
  (noteIds: readonly number[]): TrackEventsMutator<number[]> =>
  (events) => {
    const selectedNotes = getNotesByIds(noteIds)(events)
    return addEvents(selectedNotes)(events).map((e) => e.id)
  }

// update velocities of notes in the specified range using linear interpolation
export const updateVelocitiesInRange =
  (
    selectedNoteIds: readonly number[], // if empty, apply to all notes
    startTick: number,
    startValue: number,
    endTick: number,
    endValue: number,
  ): TrackEventsMutator =>
  (events) => {
    const minTick = Math.min(startTick, endTick)
    const maxTick = Math.max(startTick, endTick)
    const minValue = Math.min(startValue, endValue)
    const maxValue = Math.max(startValue, endValue)
    const getValue = (tick: number) =>
      Math.floor(
        Math.min(
          maxValue,
          Math.max(
            minValue,
            ((tick - startTick) / (endTick - startTick)) *
              (endValue - startValue) +
              startValue,
          ),
        ),
      )

    const notes =
      selectedNoteIds.length > 0
        ? getNotesByIds(selectedNoteIds)(events)
        : flow(getAll, filter(isNoteEvent))(events)

    const eventsToUpdate = notes.filter(
      isEventInRange(Range.create(minTick, maxTick)),
    )

    updateEvents(
      eventsToUpdate.map((e: TrackEvent) => ({
        id: e.id,
        velocity: getValue(e.tick),
      })),
    )(events)
  }

const quantizedNotes = (
  noteIds: readonly number[],
  quantizeRound: (tick: number) => number,
) => flow(getNotesByIds(noteIds), map(quantizeNote(quantizeRound)))

export const quantizeNotes =
  (
    noteIds: readonly number[],
    quantizeRound: (tick: number) => number,
  ): TrackEventsMutator =>
  (events) => {
    const notes = quantizedNotes(noteIds, quantizeRound)(events)
    updateEvents(notes)(events)
  }

export const addClipboardNotes = (
  data: PianoNotesClipboardData,
  tick: number,
) => {
  const notes = data.notes.map(moveEvent(tick))
  return addEvents(notes)
}
