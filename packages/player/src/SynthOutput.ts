import { AnyChannelEvent } from "midifile-ts"
import { DistributiveOmit } from "./types"

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
