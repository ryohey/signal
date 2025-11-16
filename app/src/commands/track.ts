import { clamp } from "lodash"
import { isNotUndefined } from "../helpers/array"
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
