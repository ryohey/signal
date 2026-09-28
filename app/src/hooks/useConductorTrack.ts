import { TrackEvent } from "@signal-app/core"
import { useCallback } from "react"
import { useSong } from "./useSong"

export function useConductorTrack() {
  const { conductorTrack } = useSong()

  return {
    updateEvent: useCallback(
      <T extends TrackEvent>(id: number, obj: Partial<T>) => {
        conductorTrack?.updateEvent(id, obj)
      },
      [conductorTrack],
    ),
    removeEvents: useCallback(
      (ids: readonly number[]) => {
        conductorTrack?.removeEvents(ids)
      },
      [conductorTrack],
    ),
    hasTimeSignatureAt: useCallback(
      (tick: number) => {
        return conductorTrack?.hasTimeSignatureAt(tick) ?? false
      },
      [conductorTrack],
    ),
    addTimeSignature: useCallback(
      (tick: number, numerator: number, denominator: number) => {
        conductorTrack?.addTimeSignature(tick, numerator, denominator)
      },
      [conductorTrack],
    ),
    setTempo: useCallback(
      (tick: number, bpm: number) => {
        conductorTrack?.setTempo(tick, bpm)
      },
      [conductorTrack],
    ),
  }
}
