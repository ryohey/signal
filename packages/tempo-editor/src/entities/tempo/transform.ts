import {
  bpmToUSecPerBeat,
  TrackEventOf,
  uSecPerBeatToBPM,
} from "@signal-app/core"
import { clamp } from "lodash"
import { SetTempoEvent } from "midifile-ts"
import { TempoItem } from "./TempoItem"

export const setTempoEventToTempoItem = (
  event: TrackEventOf<SetTempoEvent>,
): TempoItem => ({
  id: event.id,
  tick: event.tick,
  bpm: uSecPerBeatToBPM(event.microsecondsPerBeat),
})

export const tempoItemToSetTempoEvent = (
  item: TempoItem,
): TrackEventOf<SetTempoEvent> => ({
  id: item.id,
  type: "meta",
  subtype: "setTempo",
  tick: item.tick,
  microsecondsPerBeat: Math.floor(bpmToUSecPerBeat(item.bpm)),
})

export const moveTempoItem =
  (deltaTick: number, deltaValue: number, maxBPM: number) =>
  (item: TempoItem): TempoItem => ({
    ...item,
    tick: Math.max(0, Math.floor(item.tick + deltaTick)),
    bpm: clamp(item.bpm + deltaValue, 0, maxBPM),
  })
