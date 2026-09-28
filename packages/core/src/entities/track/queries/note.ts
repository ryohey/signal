import { flow } from "lodash"
import { filter } from "../../../helpers"
import { isNoteEvent, type NoteEvent } from "../../event"
import { getEventsByIds } from "./composed"
import type { TrackEventsQuery } from "./type"

export const getNotesByIds = (
  ids: readonly number[],
): TrackEventsQuery<readonly NoteEvent[]> =>
  flow(getEventsByIds(ids), filter(isNoteEvent))
