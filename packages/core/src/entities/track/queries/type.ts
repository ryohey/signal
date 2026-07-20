import { TrackEventsContext } from "../TrackEventsContext"

export type TrackEventsQuery<T> = (events: TrackEventsContext) => T
