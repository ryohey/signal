import { Track, TrackEvent } from "@signal-app/core"
import { useCallback, useSyncExternalStore } from "react"

const noopSubscribe = () => () => {}

export function useSyncTrackQuery<T>(
  track: Track | undefined,
  query: (events: readonly TrackEvent[]) => T,
  predicate: (event: TrackEvent) => boolean,
): T {
  return useSyncExternalStore(
    track?.observeEventsChanged(predicate).subscribe ?? noopSubscribe,
    useCallback(() => query(track?.events ?? []), [track, query]),
  )
}
