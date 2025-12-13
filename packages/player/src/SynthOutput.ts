import type { AnyChannelEvent } from "midifile-ts"
import type { DistributiveOmit } from "./types.js"

export type SendableEvent = DistributiveOmit<AnyChannelEvent, "deltaTime">

export interface SynthOutput {
  activate(): void
  sendEvent(
    event: SendableEvent,
    delayTime: number,
    timestampNow: number,
    trackId?: number
  ): void
}
