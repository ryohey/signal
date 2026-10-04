import {
  isEventOverlapRange,
  isNoteEvent,
  type Range,
  type Track,
} from "@signal-app/core"
import type { Unsubscribe } from "@signal-app/observable"
import type { VelocityItem } from "./entities/VelocityItem"
import { updateVelocitiesInRange } from "./trackMutations/note"

// Velocity is one of control-pane's lanes (alongside the pitchBend/controller
// lanes served by @signal-app/control-editor), but it edits NoteEvent.velocity
// rather than a ValueEventType-shaped value event, so it has its own facade.
// It does the simplest correct thing (read the track's full event list per
// query) rather than point-free primitives/composed mutators, since there's no
// batch business logic to compose here beyond single delegations to core Track
// mutators.
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
    updateVelocitiesInRange(
      noteIds,
      startTick,
      startValue,
      endTick,
      endValue,
    )(this.track)
  }
}
