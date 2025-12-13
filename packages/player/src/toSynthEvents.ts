import type { SynthEvent } from "@ryohey/wavelet"
import type { PlayerEvent } from "./PlayerEvent.js"
import { tickToMillisec } from "./tick.js"

interface Keyframe {
  tick: number
  bpm: number
  timestamp: number
}

export const toSynthEvents = (
  events: PlayerEvent[],
  timebase: number,
  sampleRate: number
): SynthEvent[] => {
  events = events.sort((a, b) => a.tick - b.tick)

  let keyframe: Keyframe = {
    tick: 0,
    bpm: 120,
    timestamp: 0,
  }

  const synthEvents: SynthEvent[] = []

  for (const e of events) {
    const timestamp =
      tickToMillisec(e.tick - keyframe.tick, keyframe.bpm, timebase) +
      keyframe.timestamp
    const delayTime = (timestamp / 1000) * sampleRate

    switch (e.type) {
      case "channel":
        synthEvents.push({
          type: "midi",
          midi: e,
          delayTime,
        })
        break
      case "meta":
        switch (e.subtype) {
          case "setTempo":
            keyframe = {
              tick: e.tick,
              bpm: (60 * 1000000) / e.microsecondsPerBeat,
              timestamp,
            }
            break
        }
    }
  }

  return synthEvents
}
