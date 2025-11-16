import { clamp } from "lodash"
import { NoteNumber } from "../entities/unit/NoteNumber"
import { isNotNull, isNotUndefined } from "../helpers/array"
import { SongStore } from "../stores/SongStore"
import { isNoteEvent, TrackId } from "../track"

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
