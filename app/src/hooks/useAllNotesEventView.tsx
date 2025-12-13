import { isNoteEvent } from "@signal-app/core"
import { toJS } from "mobx"
import { useCallback, useSyncExternalStore } from "react"
import { EventView } from "../observer/EventView"
import { useDisposable } from "./useDisposable"
import { useSyncEventViewWithScroll } from "./useEventView"
import { useStores } from "./useStores"

export function useEventViewForAllTracks() {
  const { songStore } = useStores()
  const createEventView = useCallback(
    () =>
      new EventView(() =>
        songStore.song.tracks.flatMap((track, index) =>
          toJS(
            track.events.filter(isNoteEvent).map((event) => ({
              tick: event.tick,
              duration: event.duration,
              event,
              trackId: track.id,
              trackIndex: index,
            }))
          )
        )
      ),
    [songStore]
  )
  return useDisposable(createEventView)
}

// Hook to get all note events across all tracks, synchronized with scroll
export function useAllNotesEventView() {
  const eventView = useEventViewForAllTracks()

  useSyncEventViewWithScroll(eventView)

  return useSyncExternalStore(eventView.subscribe, eventView.getEvents)
}
