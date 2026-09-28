import {
  isSetTempoEvent,
  type Track,
  UNASSIGNED_TRACK_ID,
} from "@signal-app/core"
import { DEFAULT_TEMPO } from "@signal-app/player"
import { useCallback } from "react"
import { useConductorTrack } from "../../../hooks/useConductorTrack"
import { usePlayer } from "../../../hooks/usePlayer"
import { useSong } from "../../../hooks/useSong"
import { useSyncTrackQuery } from "../../../hooks/useSyncTrackQuery"

export function useTempoForm() {
  const { conductorTrack } = useSong()
  const { position, setCurrentTempo } = usePlayer()
  const { setTempo } = useConductorTrack()

  return {
    get tempo() {
      const { position } = usePlayer()
      const query = useCallback(
        (track: Track) => track.getTempo(position),
        [position],
      )
      return (
        useSyncTrackQuery(
          conductorTrack?.id ?? UNASSIGNED_TRACK_ID,
          query,
          isSetTempoEvent,
        ) ?? DEFAULT_TEMPO
      )
    },
    changeTempo: useCallback(
      (bpm: number) => {
        setTempo(bpm, position)
        setCurrentTempo(bpm)
      },
      [setTempo, position, setCurrentTempo],
    ),
  }
}
