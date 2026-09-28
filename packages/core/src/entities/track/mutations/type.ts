import { TrackEvent } from "../../event/TrackEvent"
import { TrackEventsQueryContext } from "../queries"

export interface TrackEventsMutatorContext extends TrackEventsQueryContext {
  remove(id: number): readonly TrackEvent[]
  update(id: number, updatedElement: Partial<TrackEvent>): readonly TrackEvent[]
  create(event: Omit<TrackEvent, "id">): TrackEvent
}

export type TrackEventsMutator<R = void> = (
  events: TrackEventsMutatorContext,
) => R
