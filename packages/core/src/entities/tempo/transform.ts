import { clamp } from "lodash"
import { SetTempoEvent } from "midifile-ts"
import { bpmToUSecPerBeat, uSecPerBeatToBPM } from "../../helpers"
import { TrackEventOf } from "../event"

export const moveTempoEvent =
  (deltaTick: number, deltaValue: number, maxBPM: number) =>
  (event: TrackEventOf<SetTempoEvent>): TrackEventOf<SetTempoEvent> => ({
    ...event,
    tick: Math.max(0, Math.floor(event.tick + deltaTick)),
    microsecondsPerBeat: Math.floor(
      bpmToUSecPerBeat(
        clamp(
          uSecPerBeatToBPM(event.microsecondsPerBeat) + deltaValue,
          0,
          maxBPM,
        ),
      ),
    ),
  })
