import { UNASSIGNED_TRACK_ID } from "@signal-app/core"
import { useCallback, useSyncExternalStore } from "react"
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
    getEvents: useCallback(
      () => conductorTrack?.events ?? [],
      [conductorTrack],
    ),
    ...useTrackEvents(conductorTrack),
  }
}
