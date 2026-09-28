import { isNoteEvent } from "../../event"
import { BatchUpdateOperation, batchUpdateNoteVelocity } from "../../note"
import { TrackEventStore } from "../TrackEventStore"

export const batchUpdateNotesVelocity =
  (events: TrackEventStore) =>
  (noteIds: readonly number[], operation: BatchUpdateOperation) => {
    const updates = events
      .getEventsByIds(noteIds)
      .filter(isNoteEvent)
      .map(batchUpdateNoteVelocity(operation))
    return events.updateEvents(updates)
  }
