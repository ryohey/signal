import type { AnyChannelEvent, AnySysExEvent } from "midifile-ts"
import type { DistributiveOmit } from "./types.js"

export type SendableEvent = DistributiveOmit<
  AnySysExEvent | AnyChannelEvent,
  "deltaTime"
>

export interface SynthOutput {
  activate(): void
  sendEvent(
    event: SendableEvent,
    delayTime: number,
    timestampNow: number,
    trackId?: number,
  ): void
}
