import type { AnyEvent } from "midifile-ts"
import type { DistributiveOmit } from "../../types"
import type { AnySignalEvent } from "./signalEvents"

export interface TickProvider {
  tick: number
}

export interface DeltaTimeProvider {
  deltaTime: number
}

export type TrackEventRequired = TickProvider & {
  id: number

  // Mark as recording in progress
  // Do not playback in Player
  isRecording?: boolean
}

export type TrackEventOf<T> = DistributiveOmit<T, "deltaTime" | "channel"> &
  TrackEventRequired

type NoteEventContent = {
  type: "channel"
  subtype: "note"
  duration: number
  noteNumber: number
  velocity: number
}

export type NoteEvent = TrackEventOf<NoteEventContent>
export type TrackEvent = TrackEventOf<
  AnyEvent | NoteEventContent | AnySignalEvent
>

export type FeatureOf<T> = DistributiveOmit<T, "deltaTime" | "tick" | "id">
export type AnyEventFeature = FeatureOf<AnyEvent>
