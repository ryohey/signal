import { flow } from "lodash"
import { filter, isEventInRange, map } from "../../../helpers"
import { isNoteEvent } from "../../event"
import { TrackEvent } from "../../event/TrackEvent"
import { Range } from "../../geometry/Range"
import { transposeNote } from "../../note"
import { getAll, getNotesByIds } from "../queries"
import { updateEvents } from "./composed"
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
