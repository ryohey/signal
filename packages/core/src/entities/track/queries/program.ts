import { flow } from "lodash";
import type { ProgramChangeEvent } from "midifile-ts";
import { some } from "../../../helpers";
import { isBankLSBEvent, isBankMSBEvent, isProgramChangeEvent } from "../../event";
import type { TrackEvent, TrackEventOf } from "../../event/TrackEvent";
import { getAll, getEventById } from "./primitives";
import type { TrackEventsQuery, TrackEventsQueryContext } from "./type";

export const findProgramChangeEventAtOrBefore =
  (tick: number) =>
  (
    events: readonly TrackEvent[],
  ): TrackEventOf<ProgramChangeEvent> | undefined => {
    let found: TrackEventOf<ProgramChangeEvent> | undefined

    for (const event of events) {
      if (!isProgramChangeEvent(event) || event.tick > tick) {
        continue
      }
      if (found === undefined || event.tick >= found.tick) {
        found = event
      }
    }

    return found
  }

export const getProgramChangeEventAtOrBefore = (
  tick: number,
): TrackEventsQuery<TrackEventOf<ProgramChangeEvent> | undefined> =>
  flow(getAll(), findProgramChangeEventAtOrBefore(tick))

export const hasProgramChangeEventAfter = (
  tick: number,
): TrackEventsQuery<boolean> =>
  flow(
    getAll(),
    some((event) => isProgramChangeEvent(event) && event.tick > tick),
  )

/**
 * The patch of the last program change at or before the tick. The bank is the
 * one latched when that program change plays: the last bank select at or
 * before its tick (bank select on its own tick is sent before it, see
 * sortForOutput).
 */
export const findPatchAtOrBefore =
  (tick: number) => (events: readonly TrackEvent[]) => {
    const programChange = findProgramChangeEventAtOrBefore(tick)(events)
    const patch = {
      programNumber: programChange?.value ?? 0,
      bankMSB: 0,
      bankLSB: 0,
    }
    if (programChange === undefined) {
      return patch
    }
    // The events are ordered by tick, and the last one on a tick takes effect.
    // A GS or XG reset system exclusive between a bank select and the program
    // change also clears the bank on the synth, which this does not follow.
    // Neither does it follow a bank select stored after a program change and a
    // system exclusive on the same tick, which sortForOutput leaves for the
    // next program change. We keep both because such layouts are rare, and
    // telling resets apart from other system exclusives is not worth it here.
    for (const event of events) {
      if (event.tick > programChange.tick) {
        break
      }
      if (isBankMSBEvent(event)) {
        patch.bankMSB = event.value
      }
      if (isBankLSBEvent(event)) {
        patch.bankLSB = event.value
      }
    }
    return patch
  }

export const getPatchAt = (tick: number) =>
  flow(getAll(), findPatchAtOrBefore(tick))

/**
 * The ids of the bank select events on the program change's tick, which
 * belong to it.
 */
// When two program changes share a tick (imported files), both own these, so
// deleting or moving one also takes the other's bank. We keep that because
// only one of them plays there anyway, and the editor never creates that
// layout (insert updates the program change already on the tick, and a drag
// skips ticks that have one).
export const getBankSelectIds =
  (eventId: number) => (events: TrackEventsQueryContext) => {
    const programChange = getEventById(eventId)(events)
    if (programChange === undefined) {
      return []
    }
    return events
      .getArray()
      .filter(
        (e) =>
          e.tick === programChange.tick &&
          (isBankMSBEvent(e) || isBankLSBEvent(e)),
      )
      .map((e) => e.id)
  }
