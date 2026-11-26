import { last } from "lodash";
import type { ControllerEvent, ProgramChangeEvent } from "midifile-ts";
import { controllerMidiEvent, programChangeMidiEvent } from "../../../midi";
import { isControllerEventWithType, isProgramChangeEvent } from "../../event/identify";
import type { TrackEventOf } from "../../event/TrackEvent";
import type { Patch } from "../Patch";
import { getEventById } from "../queries/primitives";
import { findPatchAtOrBefore, findProgramChangeEventAtOrBefore, getBankSelectIds } from "../queries/program";
import { addEvent, removeEvent, updateEvent } from "./primitives";
import type { TrackEventsMutator } from "./type";

const bankSelects = [
  { controllerType: 0, key: "bankMSB" },
  { controllerType: 32, key: "bankLSB" },
] as const

// Bank select latches until the next program change, so a change at the tick
// would also reach the next program change if it has no bank select of its
// own. Writing the bank it plays now onto its tick keeps it, and every
// program change after it, as it was. Tracks that never use bank select (and
// a patch with bank 0) need nothing.
const keepNextProgramChange =
  (tick: number, patch?: Patch): TrackEventsMutator =>
  (events) => {
    const all = events.getArray()
    const next = all.find((e) => e.tick > tick && isProgramChangeEvent(e))
    if (next === undefined) {
      return
    }
    const nextPatch = findPatchAtOrBefore(next.tick)(all)
    for (const { controllerType, key } of bankSelects) {
      const isBankSelect = isControllerEventWithType(controllerType)
      const hasOwn = all.some((e) => e.tick === next.tick && isBankSelect(e))
      const usesBank = (patch?.[key] ?? 0) !== 0 || all.some(isBankSelect)
      if (!hasOwn && usesBank) {
        addEvent<TrackEventOf<ControllerEvent>>({
          ...controllerMidiEvent(0, 0, controllerType, nextPatch[key]),
          tick: next.tick,
        })(events)
      }
    }
  }

// Bank select on the same tick is sent before the program change (see
// sortForOutput), so the program change is updated in place
const writePatch =
  (
    tick: number,
    patch: Patch,
    programChange?: TrackEventOf<ProgramChangeEvent>,
  ): TrackEventsMutator<TrackEventOf<ProgramChangeEvent>> =>
  (events) => {
    // Read before anything is written, since keeping the next program change
    // can add the track's first bank select
    const usedBefore = bankSelects.map(({ controllerType }) =>
      events.getArray().some(isControllerEventWithType(controllerType)),
    )
    keepNextProgramChange(tick, patch)(events)
    // Updates the bank select on the tick, or adds one when the bank is not 0
    // or the track already uses bank select, so songs without banks stay free
    // of them
    for (const [index, { controllerType, key }] of bankSelects.entries()) {
      const isBankSelect = isControllerEventWithType(controllerType)
      const all = events.getArray()
      // The last one on the tick is the one that takes effect
      const existing = last(
        all.filter((e) => e.tick === tick && isBankSelect(e)),
      )
      if (existing !== undefined) {
        updateEvent<TrackEventOf<ControllerEvent>>(existing.id, {
          value: patch[key],
        })(events)
      } else if (patch[key] !== 0 || all.some(isBankSelect)) {
        // The first bank select in a track also gets bank 0 on the track's
        // first program change before it. The synth keeps the latched bank,
        // so the program changes before this one would otherwise play it too
        // when the song is played again.
        const first = all.find(isProgramChangeEvent)
        if (!usedBefore[index] && first !== undefined && first.tick < tick) {
          addEvent<TrackEventOf<ControllerEvent>>({
            ...controllerMidiEvent(0, 0, controllerType, 0),
            tick: first.tick,
          })(events)
        }
        addEvent<TrackEventOf<ControllerEvent>>({
          ...controllerMidiEvent(0, 0, controllerType, patch[key]),
          tick,
        })(events)
      }
    }
    if (programChange === undefined) {
      return addEvent<TrackEventOf<ProgramChangeEvent>>({
        ...programChangeMidiEvent(0, 0, patch.programNumber),
        tick,
      })(events)
    }
    return (
      updateEvent<TrackEventOf<ProgramChangeEvent>>(programChange.id, {
        value: patch.programNumber,
      })(events) ?? programChange
    )
  }

export const setPatchAt =
  (
    tick: number,
    patch: Patch,
  ): TrackEventsMutator<TrackEventOf<ProgramChangeEvent>> =>
  (events) => {
    const programChange = findProgramChangeEventAtOrBefore(tick)(
      events.getArray(),
    )
    return writePatch(programChange?.tick ?? 0, patch, programChange)(events)
  }

// A program change already on the tick is updated instead of getting a second
// one next to it, which would share its bank select
export const insertPatchAt =
  (
    tick: number,
    patch: Patch,
  ): TrackEventsMutator<TrackEventOf<ProgramChangeEvent>> =>
  (events) => {
    const programChange = findProgramChangeEventAtOrBefore(tick)(
      events.getArray(),
    )
    return writePatch(
      tick,
      patch,
      programChange?.tick === tick ? programChange : undefined,
    )(events)
  }

export const setPatchById =
  (
    eventId: number,
    patch: Patch,
  ): TrackEventsMutator<TrackEventOf<ProgramChangeEvent> | null> =>
  (events) => {
    const programChange = getEventById(eventId)(events)
    if (programChange === undefined || !isProgramChangeEvent(programChange)) {
      return null
    }
    return writePatch(programChange.tick, patch, programChange)(events)
  }

// While a mark is dragged, only the ticks of the program change and its own
// bank select change. The bank of it and its neighbors is settled once when the
// drag ends (moveProgramChange). A tick that has another program change is
// skipped, since the two would share the bank select there. Returns whether
// it moved.
export const dragProgramChange =
  (
    eventId: number,
    bankSelectIds: readonly number[],
    tick: number,
  ): TrackEventsMutator<boolean> =>
  (events) => {
    const isTaken = events
      .getArray()
      .some(
        (e) => e.tick === tick && e.id !== eventId && isProgramChangeEvent(e),
      )
    if (isTaken) {
      return false
    }
    for (const id of [...bankSelectIds, eventId]) {
      updateEvent(id, { tick })(events)
    }
    return true
  }

/**
 * Moves a program change from one tick to another, keeping the patch it plays
 * and the bank of the program changes around both ticks. It works like
 * removing it at fromTick and writing its patch at toTick.
 */
export const moveProgramChange =
  (
    eventId: number,
    bankSelectIds: readonly number[],
    fromTick: number,
    toTick: number,
  ): TrackEventsMutator =>
  (events) => {
    // A drag has already moved the events, so they go back first and the
    // rest works on the song as it was before the drag
    for (const id of [...bankSelectIds, eventId]) {
      updateEvent(id, { tick: fromTick })(events)
    }
    const programChange = getEventById(eventId)(events)
    if (
      toTick === fromTick ||
      programChange === undefined ||
      !isProgramChangeEvent(programChange)
    ) {
      return
    }
    // The program comes from the moved event itself, since another program
    // change can share its tick
    const patch = {
      ...findPatchAtOrBefore(fromTick)(events.getArray()),
      programNumber: programChange.value,
    }
    keepNextProgramChange(fromTick)(events)
    for (const id of bankSelectIds) {
      removeEvent(id)(events)
    }
    const moved = updateEvent<TrackEventOf<ProgramChangeEvent>>(eventId, {
      tick: toTick,
    })(events)
    writePatch(toTick, patch, moved ?? programChange)(events)
  }

export const removeProgramChange =
  (eventId: number): TrackEventsMutator =>
  (events) => {
    const programChange = getEventById(eventId)(events)
    if (programChange === undefined || !isProgramChangeEvent(programChange)) {
      return
    }
    keepNextProgramChange(programChange.tick)(events)
    for (const id of [...getBankSelectIds(eventId)(events), eventId]) {
      removeEvent(id)(events)
    }
  }
