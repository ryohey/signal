import { getTempo, setTempo } from "@signal-app/core"
import { DEFAULT_TEMPO } from "@signal-app/player"
import { useCallback, useMemo, useSyncExternalStore } from "react"
import { useMutateConductorTrack } from "../../../hooks/useCommand"
import { usePlayer } from "../../../hooks/usePlayer"
import { useSong } from "../../../hooks/useSong"

const noop = () => () => {}

export function useTempoForm() {
  const { conductorTrack } = useSong()
  const { position, setCurrentTempo } = usePlayer()
  const mutateConductorTrack = useMutateConductorTrack()

  return {
    get tempo() {
      const { position } = usePlayer()
      const events = useSyncExternalStore(
        conductorTrack?.onSetTempoEventsChanged.subscribe ?? noop,
        useCallback(
          () => conductorTrack?.getEventsSnapshot() ?? [],
          [conductorTrack],
        ),
      )
      return useMemo(
        () => getTempo(events, position) ?? DEFAULT_TEMPO,
        [events, position],
      )
    },
    changeTempo: useCallback(
      (bpm: number) => {
        mutateConductorTrack(setTempo(bpm, position))
        setCurrentTempo(bpm)
      },
      [mutateConductorTrack, position, setCurrentTempo],
    ),
  }
}
