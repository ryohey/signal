import { TrackEventsContext } from "../TrackEventsContext"

export type TrackEventsMutator<R = void> = (events: TrackEventsContext) => R
