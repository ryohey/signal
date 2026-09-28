import { TrackEvent } from "../event/TrackEvent"

export interface TrackEventStore {
  getEvents(): readonly TrackEvent[]
  getEventById(id: number): TrackEvent | undefined
  getEventsByIds(ids: readonly number[]): readonly TrackEvent[]
  addEvents<T extends TrackEvent>(
    events: readonly Omit<T, "id">[],
  ): readonly T[]
  addEvent<T extends TrackEvent>(event: Omit<T, "id">): T
  updateEvent<T extends TrackEvent>(id: number, obj: Partial<T>): T | null
  updateEvents(events: readonly Partial<TrackEvent>[]): void
  removeEvents(ids: readonly number[]): void
  removeEvent(id: number): void
}
