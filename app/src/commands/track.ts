import { clamp, maxBy, minBy } from "lodash"
import { transaction } from "mobx"
import { Range } from "../entities/geometry/Range"
import { NoteNumber } from "../entities/unit/NoteNumber"
import { isNotNull, isNotUndefined } from "../helpers/array"
import { isEventInRange } from "../helpers/filterEvents"
import { SongStore } from "../stores/SongStore"
import { isNoteEvent, NoteEvent, TrackId } from "../track"

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
