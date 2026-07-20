import { Track, TrackEvent, TrackId } from "@signal-app/core"
import { useCallback } from "react"
import { useDerivedValue } from "./useDerivedValue"
import { useSong } from "./useSong"

const noopSubscribe = () => {}

export function useSyncTrackQueryInternal<T>(
  track: Track | undefined,
  query: (events: readonly TrackEvent[]) => T,
  predicate: (event: TrackEvent) => boolean,
): T {
  const subscribeSource = useCallback(
    (listener: () => void) =>
      track?.subscribeEventsChanged(predicate, listener) ?? noopSubscribe,
    [track, predicate],
  )

  return useDerivedValue(
    subscribeSource,
    useCallback(() => query(track?.events ?? []), [track, query]),
  )
}

export function useSyncTrackQuery<T>(
  trackId: TrackId,
  query: (events: readonly TrackEvent[]) => T,
  predicate: (event: TrackEvent) => boolean,
): T {
  const { getTrack } = useSong()
  const track = getTrack(trackId)
  return useSyncTrackQueryInternal(track, query, predicate)
}
