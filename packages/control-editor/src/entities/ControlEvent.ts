import { TrackEventOf } from "@signal-app/core"
import { ControllerEvent, PitchBendEvent } from "midifile-ts"

export type ControlEvent = TrackEventOf<ControllerEvent | PitchBendEvent>
