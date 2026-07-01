import { UNASSIGNED_TRACK_ID } from "@signal-app/core"
import { useCallback, useSyncExternalStore } from "react"
import { useSong } from "./useSong"
import { useTrackEvents } from "./useTrack"

const noop = () => () => {}
const emptyArray: readonly never[] = []

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
    get timeSignatures() {
      return useSyncExternalStore(
        conductorTrack?.onTimeSignatureEventsChanged.subscribe ?? noop,
        useCallback(
          () => conductorTrack?.timeSignatureEvents ?? emptyArray,
          [conductorTrack],
        ),
      )
    },
    getEvents: useCallback(
      () => conductorTrack?.events ?? emptyArray,
      [conductorTrack],
    ),
    ...useTrackEvents(conductorTrack),
  }
}
