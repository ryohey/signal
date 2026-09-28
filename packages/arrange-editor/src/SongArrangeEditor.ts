import type { Song, Track, TrackEvent } from "@signal-app/core"
import {
  combineSubscription,
  switchSubscription,
  type Unsubscribe,
} from "@signal-app/observable"
import {
  type ArrangeNote,
  getArrangeNotesInTrack,
} from "./entities/ArrangeNote"

const runTracksTransaction = <R>(tracks: readonly Track[], fn: () => R): R => {
  const runFrom = (index: number): R =>
    index >= tracks.length
      ? fn()
      : tracks[index].transaction(() => runFrom(index + 1))

  return runFrom(0)
}

export class SongArrangeEditor {
  constructor(private readonly song: Song) {}

  private get tracks(): readonly Track[] {
    return this.song.tracks
  }

  // A mutation spans several tracks, so every track has to be inside a
  // transaction for the whole operation to emit one change notification.
  transaction = <R>(fn: () => R): R => runTracksTransaction(this.tracks, fn)

  // queries

  get trackCount(): number {
    return this.tracks.length
  }

  getEvents = (trackIndex: number): readonly TrackEvent[] =>
    this.tracks[trackIndex]?.events ?? []

  getEventById = (trackIndex: number, id: number): TrackEvent | undefined =>
    this.tracks[trackIndex]?.getEventById(id)

  getArrangeNotes = (): readonly ArrangeNote[] =>
    this.tracks.flatMap((track, index) =>
      getArrangeNotesInTrack(track.id, index)(track),
    )

  // mutations

  addEvent = (
    trackIndex: number,
    event: Omit<TrackEvent, "id">,
  ): TrackEvent | undefined => {
    // an event carried over from another track (or the clipboard) still has
    // its old id; Track assigns a fresh one on add.
    const { id: _, ...rest } = event as TrackEvent
    return this.tracks[trackIndex]?.addEvents([rest])[0]
  }

  removeEvent = (trackIndex: number, id: number): void => {
    this.tracks[trackIndex]?.removeEvent(id)
  }

  updateEvent = (
    trackIndex: number,
    id: number,
    update: Partial<TrackEvent>,
  ): void => {
    this.tracks[trackIndex]?.updateEvent(id, update)
  }

  // Track-list changes only. observeItems also fires on every event change,
  // which would re-render track-count consumers on each note edit.
  observeTrackCount = (listener: () => void): Unsubscribe =>
    this.song.onTracksChanged.subscribe(listener)

  observeItems = (listener: () => void): Unsubscribe =>
    combineSubscription([
      this.song.onTracksChanged.subscribe,
      switchSubscription(this.song.onTracksChanged.subscribe, () =>
        combineSubscription(
          this.song.tracks.map((track) => track.onEventsChanged.subscribe),
        ),
      ),
    ])(listener)
}
