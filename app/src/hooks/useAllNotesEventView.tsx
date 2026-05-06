import { isNoteEvent } from "@signal-app/core"
import { useCallback, useEffect, useSyncExternalStore } from "react"
import { EventView } from "../observer/EventView"
import { Unsubscribe } from "../types"
import { useDisposable } from "./useDisposable"
import { useSyncEventViewWithScroll } from "./useEventView"
import { useStores } from "./useStores"

export function useEventViewForAllTracks() {
  const { songStore } = useStores()
  const createEventView = useCallback(
    () =>
      new EventView(() =>
        songStore.song.tracks.flatMap((track, index) =>
          track.events.filter(isNoteEvent).map((event) => ({
            tick: event.tick,
            duration: event.duration,
            event,
            trackId: track.id,
            trackIndex: index,
          })),
        ),
      ),
    [songStore],
  )
  const eventView = useDisposable(createEventView)

  useEffect(() => {
    let unsubscribeSong: Unsubscribe | null = null
    let unsubscribeTracks: Unsubscribe | null = null
    let unsubscribeEvents: Unsubscribe[] = []

    unsubscribeSong = songStore.onSongChanged.subscribe(() => {
      unsubscribeTracks = songStore.song.onTracksChanged.subscribe(() => {
        const tracks = songStore.song.tracks
        unsubscribeEvents = tracks.map((track) =>
          track.onEventsChanged.subscribe(() => {
            eventView.triggerUpdate()
          }),
        )
      })
    })

    return () => {
      unsubscribeSong?.()
      unsubscribeTracks?.()
      unsubscribeEvents.forEach((u) => u())
    }
  }, [songStore, eventView])

  return eventView
}

// Hook to get all note events across all tracks, synchronized with scroll
export function useAllNotesEventView() {
  const eventView = useEventViewForAllTracks()

  useSyncEventViewWithScroll(eventView)

  return useSyncExternalStore(eventView.subscribe, eventView.getEvents)
}
