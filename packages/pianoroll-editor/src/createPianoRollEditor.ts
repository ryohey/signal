import {
  batchUpdateNotesVelocity,
  Song,
  TrackEventsMutator,
  TrackId,
} from "@signal-app/core"
import { dragNote, getDraggableArea, getDraggablePosition } from "./draggable"
import { NoteEvent } from "./entities"
import { getTrackOrThrow } from "./getTrackOrThrow"
import {
  addClipboardNotes,
  cloneNotes,
  duplicateNotes,
  quantizeNotes,
  removeNotes,
  transposeNotes,
  updateNotes,
} from "./mutations"
import {
  getAllNoteIds,
  getNeighborNote,
  getNoteIdsInSelection,
  getNotesByIds,
  getNotesClipboardData,
} from "./queries"
import { TrackNoteMapper } from "./TrackNoteMapper"

export const createPianoRollEditor = (song: Song, trackId: TrackId) => {
  const track = getTrackOrThrow(song, trackId)
  const mapper = new TrackNoteMapper(track)

  const bindTrackMutation =
    <A extends unknown[], R>(
      fn: (...args: A) => TrackEventsMutator<R>,
    ): ((...args: A) => R) =>
    (...args: A) =>
      track.mutate(fn(...args))

  const bindQuery =
    <A extends unknown[], R>(
      fn: (...args: A) => (context: TrackNoteMapper) => R,
    ): ((...args: A) => R) =>
    (...args: A) =>
      fn(...args)(mapper)

  // runs a composed mutation in one transaction so it emits a single change
  const bindMutation =
    <A extends unknown[], R>(
      fn: (...args: A) => (context: TrackNoteMapper) => R,
    ): ((...args: A) => R) =>
    (...args: A) =>
      track.transaction(() => fn(...args)(mapper))

  return {
    transaction: track.transaction,

    // queries

    getAllNoteIds: bindQuery(getAllNoteIds),
    getDraggableArea: bindQuery(getDraggableArea),
    getDraggablePosition: bindQuery(getDraggablePosition),
    getNeighborNote: bindQuery(getNeighborNote),
    getNoteIdsInSelection: bindQuery(getNoteIdsInSelection),
    getNotesByIds: bindQuery(getNotesByIds),
    getNotesClipboardData: bindQuery(getNotesClipboardData),

    // mutations

    addNote: mapper.addNote,
    removeNote: mapper.removeNote,
    updateNote: mapper.updateNote,
    updateNotes: (notes: readonly NoteEvent[]) =>
      track.transaction(() => updateNotes(mapper)(notes)),
    addClipboardNotes: bindMutation(addClipboardNotes),
    cloneNotes: bindMutation(cloneNotes),
    dragNote: bindMutation(dragNote),
    duplicateNotes: bindMutation(duplicateNotes),
    quantizeNotes: bindMutation(quantizeNotes),
    removeNotes: bindMutation(removeNotes),
    transposeNotes: bindMutation(transposeNotes),
    batchUpdateNotesVelocity: bindTrackMutation(batchUpdateNotesVelocity),
  }
}
