import type { ProgramChangeEvent } from "midifile-ts"
import { programChangeMidiEvent } from "../../../midi"
import type { TrackEventOf } from "../../event/TrackEvent"
import { findProgramChangeEventAtOrBefore } from "../queries/program"
import { updateOrAdd } from "./composed"
import { addEvent, updateEvent } from "./primitives"
import type { TrackEventsMutator } from "./type"

export const setProgramNumberAt = (
  tick: number,
  programNumber: number,
): TrackEventsMutator<TrackEventOf<ProgramChangeEvent> | null> =>
  updateOrAdd<TrackEventOf<ProgramChangeEvent>>(
    findProgramChangeEventAtOrBefore(tick),
    {
      ...programChangeMidiEvent(0, 0, programNumber),
      tick: 0,
    },
  )

export const insertProgramChangeAt = (
  tick: number,
  programNumber: number,
): TrackEventsMutator<TrackEventOf<ProgramChangeEvent>> =>
  addEvent<TrackEventOf<ProgramChangeEvent>>({
    ...programChangeMidiEvent(0, 0, programNumber),
    tick,
  })

export const setProgramNumberById = (
  eventId: number,
  programNumber: number,
): TrackEventsMutator<TrackEventOf<ProgramChangeEvent> | null> =>
  updateEvent<TrackEventOf<ProgramChangeEvent>>(eventId, {
    value: programNumber,
  })
