import type { AnyEvent } from "midifile-ts"
import type { DistributiveOmit } from "./types.js"

export type PlayerEventOf<T> = DistributiveOmit<T, "deltaTime"> & {
  tick: number
  trackId: number | null
}

export type PlayerEvent = PlayerEventOf<AnyEvent>
