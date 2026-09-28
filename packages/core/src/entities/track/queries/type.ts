import { TrackEvent } from "../../event/TrackEvent"

export interface TrackEventsQueryContext {
  get(id: number): TrackEvent | undefined
  getArray(): readonly TrackEvent[]
}

export type TrackEventsQuery<T> = (events: TrackEventsQueryContext) => T
