import { Track, TrackEvent, TrackEventsQuery, TrackId } from "@signal-app/core"
import { useCallback } from "react"
import { useDerivedValue } from "./useDerivedValue"
import { useSong } from "./useSong"

const noopSubscribe = () => {}

export function useSyncTrackQueryInternal<T>(
  track: Track | undefined,
  query: TrackEventsQuery<T>,
  predicate: (event: TrackEvent) => boolean,
): T | undefined {
  const subscribeSource = useCallback(
    (listener: () => void) =>
      track?.subscribeEventsChanged(predicate, listener) ?? noopSubscribe,
    [track, predicate],
  )

  return useDerivedValue(
    subscribeSource,
    useCallback(() => track?.query(query), [track, query]),
  )
}

export function useSyncTrackQuery<T>(
  trackId: TrackId,
  query: TrackEventsQuery<T>,
  predicate: (event: TrackEvent) => boolean,
): T | undefined {
  const { getTrack } = useSong()
  const track = getTrack(trackId)
  return useSyncTrackQueryInternal(track, query, predicate)
}
