import { toJS } from "mobx"
import { useCallback, useSyncExternalStore } from "react"
import Song from "../song"
import { isNoteEvent } from "../track"
import {
  useEventViewInternal,
  useSyncEventViewWithScroll,
} from "./useEventView"

export function useEventViewForAllTracks() {
  const fetchEvents = useCallback(
    (song: Song) =>
      song.tracks.flatMap((track, index) =>
        toJS(
          track.events.filter(isNoteEvent).map((event) => ({
            tick: event.tick,
            event,
            trackId: track.id,
            trackIndex: index,
          })),
        ),
      ),
    [],
  )
  return useEventViewInternal(fetchEvents)
}

// Hook to get all note events across all tracks, synchronized with scroll
export function useAllNotesEventView() {
  const eventView = useEventViewForAllTracks()

  useSyncEventViewWithScroll(eventView)

  return useSyncExternalStore(eventView.subscribe, eventView.getEvents)
}
