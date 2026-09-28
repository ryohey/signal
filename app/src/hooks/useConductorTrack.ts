import { useCallback } from "react"
import { useSong } from "./useSong"

export function useConductorTrack() {
  const { conductorTrack } = useSong()

  return {
    setTempo: useCallback(
      (tick: number, bpm: number) => {
        conductorTrack?.setTempo(tick, bpm)
      },
      [conductorTrack],
    ),
  }
}
