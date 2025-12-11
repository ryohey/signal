import { AnyChannelEvent } from "midifile-ts"
import { DistributiveOmit } from "./types.js"

export type SendableEvent = DistributiveOmit<AnyChannelEvent, "deltaTime">

export interface SynthOutput {
  /** Whether the synth is ready to play audio (SoundFont loaded, AudioContext running) */
  readonly isReady: boolean
  activate(): void
  sendEvent(
    event: SendableEvent,
    delayTime: number,
    timestampNow: number,
    trackId?: number,
  ): void
}
