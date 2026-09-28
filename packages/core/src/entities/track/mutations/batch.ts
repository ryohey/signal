import { isNoteEvent } from "../../event"
import { type BatchUpdateOperation, batchUpdateNoteVelocity } from "../../note"
import type { TrackEventStore } from "../TrackEventStore"

export const batchUpdateNotesVelocity =
  (events: TrackEventStore) =>
  (noteIds: readonly number[], operation: BatchUpdateOperation) => {
    const updates = events
      .getEventsByIds(noteIds)
      .filter(isNoteEvent)
      .map(batchUpdateNoteVelocity(operation))
    return events.updateEvents(updates)
  }
