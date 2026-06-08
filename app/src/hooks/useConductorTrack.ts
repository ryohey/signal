import { getTempo, UNASSIGNED_TRACK_ID } from "@signal-app/core"
import { useCallback, useMemo, useSyncExternalStore } from "react"
import { DEFAULT_TEMPO } from "../Constants"
import { usePlayer } from "./usePlayer"
import { useSong } from "./useSong"
import { useTrackEvents } from "./useTrack"

const noop = () => () => {}

export function useConductorTrack() {
  const { conductorTrack } = useSong()

  return {
    get id() {
      return useSyncExternalStore(
        conductorTrack?.onIdChanged.subscribe ?? noop,
        useCallback(
          () => conductorTrack?.id ?? UNASSIGNED_TRACK_ID,
          [conductorTrack],
        ),
      )
    },
    get currentTempo() {
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
