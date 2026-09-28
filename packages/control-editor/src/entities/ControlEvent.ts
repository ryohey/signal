import type { TrackEventOf } from "@signal-app/core"
import type { ControllerEvent, PitchBendEvent } from "midifile-ts"

export type ControlEvent = TrackEventOf<ControllerEvent | PitchBendEvent>
