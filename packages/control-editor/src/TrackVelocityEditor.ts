import {
  isEventOverlapRange,
  isNoteEvent,
  Range,
  Track,
  updateVelocitiesInRange,
} from "@signal-app/core"
import { Unsubscribe } from "@signal-app/observable"
import { VelocityItem } from "./entities/VelocityItem"

// Velocity is control-pane's own lane (alongside pitchBend/controller
// lanes), but it edits NoteEvent.velocity, not a ValueEventType-shaped
// value event - it doesn't fit TrackControlEditor's per-ValueEventType
// scoping, so it's a separate, smaller facade instead of a third
// ValueEventType variant. Like TrackControlEditor, it does the simplest
// correct thing (read the track's full event list per query) rather than
// point-free primitives/composed mutators, since there's no batch business
// logic to compose here beyond single delegations to core Track mutators.
export class TrackVelocityEditor {
  constructor(private readonly track: Track) {}

  getNotesInRange = (range: Range): readonly VelocityItem[] =>
    this.track.events
      .filter(isEventOverlapRange(range))
      .filter(isNoteEvent)
      .map((e) => ({ id: e.id, tick: e.tick, velocity: e.velocity }))

  observeItems = (listener: () => void): Unsubscribe =>
    this.track.subscribeEventsChanged(isNoteEvent, listener)

  setVelocity = (noteIds: readonly number[], velocity: number): void => {
    this.track.updateEvents(noteIds.map((id) => ({ id, velocity })))
  }

  updateVelocityInRange = (
    noteIds: readonly number[],
    startTick: number,
    startValue: number,
    endTick: number,
    endValue: number,
  ): void => {
    this.track.mutate(
      updateVelocitiesInRange(
        noteIds,
        startTick,
        startValue,
        endTick,
        endValue,
      ),
    )
  }
}
