import type { TrackEvent, TrackEventStore } from "@signal-app/core"

export const getEventsByIdsOrAll =
  (ids: readonly number[]) =>
  (track: TrackEventStore): readonly TrackEvent[] => {
    if (ids.length === 0) {
      return [...track.getEvents()]
    }
    return [...track.getEventsByIds(ids)].sort((a, b) => a.tick - b.tick)
  }
