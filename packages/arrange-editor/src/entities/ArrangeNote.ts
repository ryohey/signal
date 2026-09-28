import {
  isNoteEvent,
  NoteEvent,
  TrackEventStore,
  TrackId,
} from "@signal-app/core"

export type ArrangeNoteContent = {
  readonly tick: number
  readonly duration: number
  readonly noteNumber: number
  readonly velocity: number
}

export type ArrangeNote = ArrangeNoteContent & {
  readonly id: number
  readonly event: NoteEvent
  readonly trackId: TrackId
  readonly trackIndex: number
}

export const getArrangeNotesInTrack =
  (trackId: TrackId, trackIndex: number) =>
  (track: TrackEventStore): readonly ArrangeNote[] =>
    track
      .getEvents()
      .filter(isNoteEvent)
      .map((event) => ({
        id: event.id,
        tick: event.tick,
        duration: event.duration,
        noteNumber: event.noteNumber,
        velocity: event.velocity,
        event,
        trackId,
        trackIndex,
      }))
