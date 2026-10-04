import { bpmToUSecPerBeat, setTempoMidiEvent, Track } from "@signal-app/core"
import { TrackTempoEditor } from "./TrackTempoEditor"

export const createTrackTempoEditor = (
  items: readonly { tick: number; bpm: number }[] = [],
): TrackTempoEditor => {
  const conductorTrack = new Track()

  conductorTrack.addEvents(
    items.map((item) => ({
      ...setTempoMidiEvent(0, Math.floor(bpmToUSecPerBeat(item.bpm))),
      tick: item.tick,
    })),
  )

  return new TrackTempoEditor(conductorTrack)
}
