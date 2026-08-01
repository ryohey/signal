import {
  getTempo,
  isSetTempoEvent,
  selectorToQuery,
  setTempo,
  UNASSIGNED_TRACK_ID,
} from "@signal-app/core"
import { DEFAULT_TEMPO } from "@signal-app/player"
import { useCallback, useMemo } from "react"
import { useMutateConductorTrack } from "../../../hooks/useCommand"
import { usePlayer } from "../../../hooks/usePlayer"
import { useSong } from "../../../hooks/useSong"
import { useSyncTrackQuery } from "../../../hooks/useSyncTrackQuery"

export function useTempoForm() {
  const { conductorTrack } = useSong()
  const { position, setCurrentTempo } = usePlayer()
  const mutate = useMutateConductorTrack()

  return {
    get tempo() {
      const { position } = usePlayer()
      const query = useMemo(
        () => selectorToQuery(getTempo(position)),
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
        mutate(setTempo(bpm, position))
        setCurrentTempo(bpm)
      },
      [mutate, position, setCurrentTempo],
    ),
  }
}
