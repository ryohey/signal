import {
  isSetTempoEvent,
  isTimeSignatureEvent,
  Measure,
  UNASSIGNED_TRACK_ID,
} from "@signal-app/core"
import { isEqual } from "lodash"
import { useCallback, useMemo } from "react"
import { useMobxGetter, useMobxSelector } from "./useMobxSelector"
import { usePlayer } from "./usePlayer"
import { useSong } from "./useSong"
import { useTrackEvents } from "./useTrack"

export function useConductorTrack() {
  const { tracks, timebase } = useSong()
  const conductorTrack = useMobxSelector(
    () => tracks.find((t) => t.isConductorTrack),
    [tracks],
  )
  const timeSignatures = useMobxSelector(
    () => (conductorTrack?.events ?? []).filter(isTimeSignatureEvent),
    [conductorTrack],
    isEqual,
  )
  const measures = useMemo(
    () => Measure.fromTimeSignatures(timeSignatures, timebase),
    [timeSignatures, timebase],
  )

  return {
    get id() {
      return useMobxGetter(conductorTrack, "id") ?? UNASSIGNED_TRACK_ID
    },
    get currentTempo() {
      const { position } = usePlayer()
      return useMobxSelector(
        () => conductorTrack?.getTempo(position) ?? 0,
        [conductorTrack, position],
      )
    },
    get tempoEvents() {
      return useMobxSelector(
        () => (conductorTrack?.events ?? []).filter(isSetTempoEvent),
        [conductorTrack],
        isEqual,
      )
    },
    timeSignatures,
    measures,
    getEvents: useCallback(
      () => conductorTrack?.events ?? [],
      [conductorTrack],
    ),
    setTempo: useCallback(
      (bpm: number, tick: number) => {
        conductorTrack?.setTempo(bpm, tick)
      },
      [conductorTrack],
    ),
    ...useTrackEvents(conductorTrack),
  }
}
