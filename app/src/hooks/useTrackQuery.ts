import { TrackEventsQuery, TrackId } from "@signal-app/core"
import { useCallback } from "react"
import { useSong } from "./useSong"

export function useTrackQuery(
  trackId: TrackId,
): <R = void>(fn: TrackEventsQuery<R>) => R | undefined {
  const { getTrack } = useSong()
  return useCallback(
    <R = void>(fn: TrackEventsQuery<R>) => {
      const track = getTrack(trackId)
      if (!track) {
        return undefined
      }
      return track.query(fn)
    },
    [trackId, getTrack],
  )
}

export function useConductorTrackQuery(): <R = void>(
  fn: TrackEventsQuery<R>,
) => R | undefined {
  const { conductorTrack } = useSong()
  return useCallback(
    <R = void>(fn: TrackEventsQuery<R>) => {
      if (!conductorTrack) {
        return undefined
      }
      return conductorTrack.query(fn)
    },
    [conductorTrack],
  )
}
