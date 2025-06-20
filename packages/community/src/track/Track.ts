import { max } from "lodash"
import { AnyEvent } from "midifile-ts"
import { DistributiveOmit } from "../types"

export type TrackEventOf<T> = DistributiveOmit<T, "deltaTime"> & {
  tick: number
}

export type TrackEvent = TrackEventOf<AnyEvent>

export interface Track {
  events: TrackEvent[]
  endOfTrack: number
}

export function getEndOfTrack(events: TrackEvent[]) {
  return max(events.map((event) => event.tick)) ?? 0
}
