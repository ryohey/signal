import { AnyEvent } from "midifile-ts"
import { DistributiveOmit } from "./types"

export type PlayerEventOf<T> = DistributiveOmit<T, "deltaTime"> & {
  tick: number
  trackId: number
}

export type PlayerEvent = PlayerEventOf<AnyEvent>
