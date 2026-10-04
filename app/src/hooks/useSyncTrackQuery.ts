import type { Track, TrackEvent, TrackId } from "@signal-app/core"
import { useCallback } from "react"
import { useDerivedValue } from "./useDerivedValue"
import { useSong } from "./useSong"

const noopSubscribe = () => {}

export function useSyncTrackQueryInternal<T>(
  track: Track | undefined,
  query: (track: Track) => T,
  predicate: (event: TrackEvent) => boolean,
): T | undefined {
  const subscribeSource = useCallback(
    (listener: () => void) =>
      track?.subscribeEventsChanged(predicate, listener) ?? noopSubscribe,
    [track, predicate],
  )

  return useDerivedValue(
    subscribeSource,
    useCallback(() => (track ? query(track) : undefined), [track, query]),
  )
}

export function useSyncTrackQuery<T>(
  trackId: TrackId,
  query: (track: Track) => T,
  predicate: (event: TrackEvent) => boolean,
): T | undefined {
  const { getTrack } = useSong()
  const track = getTrack(trackId)
  return useSyncTrackQueryInternal(track, query, predicate)
}
