import { flow } from "lodash"
import { map } from "../../../helpers"
import { BatchUpdateOperation, batchUpdateNoteVelocity } from "../../note"
import { getNotesByIds } from "../queries"
import { TrackEventsMutator } from "../Track"
import { updateEvents } from "./basic"

export const batchUpdateNotesVelocity = (
  noteIds: readonly number[],
  operation: BatchUpdateOperation,
): TrackEventsMutator =>
  flow(
    getNotesByIds(noteIds),
    map(batchUpdateNoteVelocity(operation)),
    updateEvents,
  )
