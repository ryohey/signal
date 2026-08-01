import { AnyEvent } from "midifile-ts"
import { DistributiveOmit } from "./types.js"

export type PlayerEventOf<T> = DistributiveOmit<T, "deltaTime"> & {
  tick: number
  trackId: number | null
}

export type PlayerEvent = PlayerEventOf<AnyEvent>
