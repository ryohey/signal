import { Range } from "@signal-app/core"
import { clamp, max, maxBy, min, minBy } from "lodash"
import { transaction } from "mobx"
import { TrackEvents } from "../entities/event/TrackEvents"
import { NoteNumber } from "../entities/unit/NoteNumber"
import { isNotNull, isNotUndefined } from "../helpers/array"
import { isEventInRange } from "../helpers/filterEvents"
import { SongStore } from "../stores/SongStore"
import { isNoteEvent, NoteEvent, TrackId } from "../track"
import { TrackEvent } from "../track/TrackEvent"

export interface BatchUpdateOperation {
  readonly type: "set" | "add" | "multiply"
  readonly value: number
}

export class TrackCommandService {
  constructor(private readonly songStore: SongStore) {}

  batchUpdateNotesVelocity = (
    trackId: TrackId,
    noteIds: number[],
    operation: BatchUpdateOperation,
  ) => {
    const track = this.songStore.song.getTrack(trackId)

    if (!track) {
      return
    }

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

  transposeNotes = (
    trackId: TrackId,
    noteIds: number[],
    deltaPitch: number,
  ) => {
    const track = this.songStore.song.getTrack(trackId)

    if (!track) {
      return
    }

    track.updateEvents(
      noteIds
        .map((id) => {
          const n = track.getEventById(id)
          if (n == undefined || !isNoteEvent(n)) {
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

  duplicateEvents = (trackId: TrackId, eventIds: number[]) => {
    const track = this.songStore.song.getTrack(trackId)

    if (!track) {
      return []
    }

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

    return transaction(() => events.map((e) => track.createOrUpdate(e))).filter(
      isNotUndefined,
    )
  }

  // duplicate notes with an optional deltaTick
  // if deltaTick is 0, duplicate to the right of the selected notes
  duplicateNotes = (trackId: TrackId, noteIds: number[], deltaTick: number) => {
    const track = this.songStore.song.getTrack(trackId)

    if (!track) {
      return { addedNoteIds: [], deltaTick: 0 }
    }

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
    const addedNoteIds = track.addEvents(notes).map((n) => n.id)

    return {
      addedNoteIds,
      deltaTick,
    }
  }

  // update velocities of notes in the specified range using linear interpolation
  updateVelocitiesInRange = (
    trackId: TrackId,
    selectedNoteIds: number[], // if empty, apply to all notes
    startTick: number,
    startValue: number,
    endTick: number,
    endValue: number,
  ) => {
    const track = this.songStore.song.getTrack(trackId)

    if (!track) {
      return
    }

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

    transaction(() => {
      track.updateEvents(
        events.map((e) => ({
          id: e.id,
          velocity: getValue(e.tick),
        })),
      )
    })
  }

  removeRedundantEvents = <T extends TrackEvent>(
    trackId: TrackId,
    event: T & { subtype?: string; controllerType?: number },
  ) => {
    const track = this.songStore.song.getTrack(trackId)
    if (!track) {
      return
    }
    const eventsIdsToRemove = TrackEvents.getRedundantEvents(event)(
      track.events,
    )
      .filter((e) => e.id !== event.id)
      .map((e) => e.id)
    track.removeEvents(eventsIdsToRemove)
  }

  removeRedundantEventsForEventIds = (trackId: TrackId, eventIds: number[]) => {
    const track = this.songStore.song.getTrack(trackId)
    if (!track) {
      return
    }
    const controllerEvents = track.events.filter((e) => eventIds.includes(e.id))
    transaction(() =>
      controllerEvents.forEach((e) => this.removeRedundantEvents(trackId, e)),
    )
  }

  quantizeNotes = (
    trackId: TrackId,
    noteIds: number[],
    quantizeRound: (tick: number) => number,
  ) => {
    const track = this.songStore.song.getTrack(trackId)
    if (!track) {
      return
    }
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
}

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
