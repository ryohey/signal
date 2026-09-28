import {
  isNoteEvent,
  type NoteEvent,
  type TrackEventStore,
} from "@signal-app/core"
import { updateVelocitiesLinear } from "../entities/note"

// update velocities of notes in the specified range using linear interpolation
export const updateVelocitiesInRange =
  (
    selectedNoteIds: readonly number[], // if empty, apply to all notes
    startTick: number,
    startValue: number,
    endTick: number,
    endValue: number,
  ) =>
  (events: TrackEventStore) => {
    const notes = (
      selectedNoteIds.length > 0
        ? events.getEventsByIds(selectedNoteIds)
        : events.getEvents()
    ).filter(isNoteEvent)

    const updatedNotes = updateVelocitiesLinear<NoteEvent>(
      startTick,
      startValue,
      endTick,
      endValue,
    )(notes)

    events.updateEvents(updatedNotes)
  }
