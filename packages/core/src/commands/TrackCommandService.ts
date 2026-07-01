import { clamp, max, maxBy, min, minBy } from "lodash"
import { AnyEvent } from "midifile-ts"
import {
  isNoteEvent,
  NoteEvent,
  Range,
  Track,
  TrackEvent,
  TrackEvents,
  TrackId,
} from "../entities"
import { NoteNumber } from "../entities/unit/NoteNumber"
import { closedRange, isNotNull, isNotUndefined } from "../helpers/array"
import { isEventInRange } from "../helpers/filterEvents"
import { ISongStore } from "./interfaces"

export interface BatchUpdateOperation {
  readonly type: "set" | "add" | "multiply"
  readonly value: number
}

export const batchUpdateNotesVelocity =
  (track: Track) => (noteIds: number[], operation: BatchUpdateOperation) => {
    const selectedNotes = noteIds
      .map((id) => track.getEventById(id))
      .filter(isNotUndefined)
      .filter(isNoteEvent)
    track.updateEvents(
      selectedNotes.map((note) => ({
        id: note.id,
        velocity: clamp(
          Math.floor(applyOperation(operation, note.velocity)),
          1,
          127,
        ),
      })),
    )
  }

export const transposeNotes =
  (track: Track) => (noteIds: number[], deltaPitch: number) => {
    track.updateEvents(
      noteIds
        .map((id) => {
          const n = track.getEventById(id)
          if (n === undefined || !isNoteEvent(n)) {
            return null
          }
          return {
            id,
            noteNumber: NoteNumber.clamp(n.noteNumber + deltaPitch),
          }
        })
        .filter(isNotNull),
    )
  }

export const duplicateEvents = (track: Track) => (eventIds: number[]) => {
  const selectedEvents = eventIds
    .map((id) => track.getEventById(id))
    .filter(isNotUndefined)

  // move to the end of selection
  const deltaTick =
    (maxBy(selectedEvents, (e) => e.tick)?.tick ?? 0) -
    (minBy(selectedEvents, (e) => e.tick)?.tick ?? 0)

  const events = selectedEvents.map((note) => ({
    ...note,
    tick: note.tick + deltaTick,
  }))

  return track
    .transaction(() => events.map((e) => track.createOrUpdate(e)))
    .filter(isNotUndefined)
    .map((e) => e.id)
}

// duplicate notes with an optional deltaTick
// if deltaTick is 0, duplicate to the right of the selected notes
const duplicateNotes =
  (track: Track) => (noteIds: number[], deltaTick: number) => {
    const selectedNotes = noteIds
      .map((id) => track.getEventById(id))
      .filter(isNotUndefined)
      .filter(isNoteEvent)

    if (deltaTick === 0) {
      const left = min(selectedNotes.map((n) => n.tick)) ?? 0
      const right = max(selectedNotes.map((n) => n.tick + n.duration)) ?? 0
      deltaTick = right - left
    }

    const notes = selectedNotes.map((note) => ({
      ...note,
      tick: note.tick + deltaTick,
    }))

    // select the created notes
    const addedNoteIds = track.addEvents(notes).map((n: TrackEvent) => n.id)

    return {
      addedNoteIds,
      deltaTick,
    }
  }

// update velocities of notes in the specified range using linear interpolation
const updateVelocitiesInRange =
  (track: Track) =>
  (
    selectedNoteIds: number[], // if empty, apply to all notes
    startTick: number,
    startValue: number,
    endTick: number,
    endValue: number,
  ) => {
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
        ? selectedNoteIds.map((id) => track.getEventById(id) as NoteEvent)
        : track.events.filter(isNoteEvent)

    const events = notes.filter(isEventInRange(Range.create(minTick, maxTick)))

    track.transaction(() => {
      track.updateEvents(
        events.map((e: TrackEvent) => ({
          id: e.id,
          velocity: getValue(e.tick),
        })),
      )
    })
  }

export const removeRedundantEvents =
  (track: Track) =>
  <T extends TrackEvent>(
    event: T & { subtype?: string; controllerType?: number },
  ) => {
    const eventsIdsToRemove = TrackEvents.getRedundantEvents(event)(
      track.events,
    )
      .filter((e) => e.id !== event.id)
      .map((e) => e.id)
    track.removeEvents(eventsIdsToRemove)
  }

export const removeRedundantEventsForEventIds =
  (track: Track) => (eventIds: number[]) => {
    const controllerEvents = track.events.filter((e: TrackEvent) =>
      eventIds.includes(e.id),
    )
    track.transaction(() =>
      controllerEvents.forEach((e: TrackEvent) =>
        removeRedundantEvents(track)(e),
      ),
    )
  }

const quantizeNotes =
  (track: Track) =>
  (noteIds: number[], quantizeRound: (tick: number) => number) => {
    const notes = noteIds
      .map((id) => track.getEventById(id))
      .filter(isNotUndefined)
      .filter(isNoteEvent)
      .map((e) => ({
        ...e,
        tick: quantizeRound(e.tick),
      }))

    track.updateEvents(notes)
  }

// Update events in the range with easing interpolation values
const updateEventsInRangeWithEasing =
  (track: Track) =>
  (
    filterEvent: (e: TrackEvent) => boolean,
    createEvent: (value: number) => AnyEvent,
    quantizeFloor: (tick: number) => number,
    quantizeUnit: number,
    startValue: number,
    endValue: number,
    startTick: number,
    endTick: number,
    easing: (t: number) => number,
  ) => {
    const minTick = Math.min(startTick, endTick)
    const maxTick = Math.max(startTick, endTick)
    const _startTick = quantizeFloor(Math.max(0, minTick))
    const _endTick = quantizeFloor(Math.max(0, maxTick))

    const getValue =
      endTick === startTick
        ? () => endValue
        : (tick: number) => {
            const t = (tick - startTick) / (endTick - startTick)
            const easedT = easing(t)
            const value = startValue + easedT * (endValue - startValue)
            return Math.floor(
              Math.min(
                Math.max(startValue, endValue),
                Math.max(Math.min(startValue, endValue), value),
              ),
            )
          }

    const events = track.events
      .filter(filterEvent)
      .filter(
        (e) =>
          e.tick !== startTick &&
          e.tick >= Math.min(minTick, _startTick) &&
          e.tick <= Math.max(maxTick, _endTick),
      )

    track.transaction(() => {
      track.removeEvents(events.map((e) => e.id))
      const newEvents = closedRange(_startTick, _endTick, quantizeUnit).map(
        (tick) => ({
          ...createEvent(getValue(tick)),
          tick,
        }),
      )
      track.addEvents(newEvents)
    })
  }

// Update  events in the range with linear interpolation values
const updateEventsInRange =
  (track: Track) =>
  (
    filterEvent: (e: TrackEvent) => boolean,
    createEvent: (value: number) => AnyEvent,
    quantizeFloor: (tick: number) => number,
    quantizeUnit: number,
    startValue: number,
    endValue: number,
    startTick: number,
    endTick: number,
  ) => {
    const minTick = Math.min(startTick, endTick)
    const maxTick = Math.max(startTick, endTick)
    const _startTick = quantizeFloor(Math.max(0, minTick))
    const _endTick = quantizeFloor(Math.max(0, maxTick))

    const minValue = Math.min(startValue, endValue)
    const maxValue = Math.max(startValue, endValue)

    // linear interpolate
    const getValue =
      endTick === startTick
        ? () => endValue
        : (tick: number) =>
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

    // Delete events in the dragged area
    const events = track.events.filter(filterEvent).filter(
      (e) =>
        // to prevent remove the event created previously, do not remove the event placed at startTick
        e.tick !== startTick &&
        e.tick >= Math.min(minTick, _startTick) &&
        e.tick <= Math.max(maxTick, _endTick),
    )

    track.transaction(() => {
      track.removeEvents(events.map((e) => e.id))

      const newEvents = closedRange(_startTick, _endTick, quantizeUnit).map(
        (tick) => ({
          ...createEvent(getValue(tick)),
          tick,
        }),
      )

      track.addEvents(newEvents)
    })
  }

export function createBindTrack(songStore: ISongStore) {
  function bindTrack<Args extends unknown[], Result>(
    command: (track: Track) => (...args: Args) => Result,
    // biome-ignore lint/suspicious/noConfusingVoidType: allow void for commands that may not return a value
  ): (trackId: TrackId, ...args: Args) => Result | void
  function bindTrack<Args extends unknown[], Result>(
    command: (track: Track) => (...args: Args) => Result,
    orFailure: Result,
  ): (trackId: TrackId, ...args: Args) => Result
  function bindTrack<Args extends unknown[], Result>(
    command: (track: Track) => (...args: Args) => Result,
    orFailure?: Result,
  ) {
    return (trackId: TrackId, ...args: Args) => {
      const track = songStore.song.getTrack(trackId)
      if (!track) {
        return orFailure
      }
      return command(track)(...args)
    }
  }
  return bindTrack
}

export const createTrackCommandService = (songStore: ISongStore) => {
  const bindTrack = createBindTrack(songStore)

  return {
    batchUpdateNotesVelocity: bindTrack(batchUpdateNotesVelocity),
    transposeNotes: bindTrack(transposeNotes),
    duplicateEvents: bindTrack(duplicateEvents, []),
    duplicateNotes: bindTrack(duplicateNotes, {
      addedNoteIds: [],
      deltaTick: 0,
    }),
    updateVelocitiesInRange: bindTrack(updateVelocitiesInRange),
    removeRedundantEvents: bindTrack(removeRedundantEvents),
    removeRedundantEventsForEventIds: bindTrack(
      removeRedundantEventsForEventIds,
    ),
    quantizeNotes: bindTrack(quantizeNotes),
    updateEventsInRangeWithEasing: bindTrack(updateEventsInRangeWithEasing),
    updateEventsInRange: bindTrack(updateEventsInRange),
  }
}

export type TrackCommandService = ReturnType<typeof createTrackCommandService>

const applyOperation = (operation: BatchUpdateOperation, value: number) => {
  switch (operation.type) {
    case "set":
      return operation.value
    case "add":
      return value + operation.value
    case "multiply":
      return value * operation.value
  }
}
