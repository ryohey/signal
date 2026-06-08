import { TrackEvent, TrackId } from "@signal-app/core"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react"
import { EventView } from "../observer/EventView"
import { Unsubscribe } from "../types"
import { useDisposable } from "./useDisposable"
import { useStores } from "./useStores"
import { useTickScroll } from "./useTickScroll"

// biome-ignore lint/style/noNonNullAssertion: We ensure that the context is provided in EventViewProvider
const EventViewContext = createContext<EventView<TrackEvent>>(null!)

export function useSyncEventViewWithScroll<T extends { tick: number }>(
  eventView: EventView<T>,
) {
  const { canvasWidth, scrollLeft, transform: tickTransform } = useTickScroll()
  const startTick = tickTransform.getTick(scrollLeft)
  const endTick = tickTransform.getTick(scrollLeft + canvasWidth)

  useEffect(() => {
    eventView.setRange(startTick, endTick)
  }, [eventView, startTick, endTick])
}

export function useEventViewForTrack(trackId: TrackId) {
  const { songStore } = useStores()
  const createEventView = useCallback(
    () => new EventView(() => songStore.song.getTrack(trackId)?.events ?? []),
    [songStore, trackId],
  )
  const eventView = useDisposable(createEventView)

  useEffect(() => {
    let unsubscribeTracks: Unsubscribe | null = null
    let unsubscribeEvents: Unsubscribe | null = null
    let unsubscribeSong: Unsubscribe | null = null

    const subscribeEvents = () => {
      unsubscribeEvents?.()
      const track = songStore.song.getTrack(trackId)
      unsubscribeEvents =
        track?.onEventsChanged.subscribe(() => {
          eventView.triggerUpdate()
        }) ?? null
    }

    const subscribeTracks = () => {
      unsubscribeTracks?.()
      unsubscribeTracks = songStore.song.onTracksChanged.subscribe(() => {
        subscribeEvents()
      })
      subscribeEvents()
    }

    unsubscribeSong = songStore.onSongChanged.subscribe(() => {
      subscribeTracks()
    })

    subscribeTracks()

    return () => {
      unsubscribeSong?.()
      unsubscribeTracks?.()
      unsubscribeEvents?.()
    }
  }, [songStore, trackId, eventView])

  return eventView
}

export function EventViewProvider({
  trackId,
  children,
}: {
  trackId: TrackId
  children: React.ReactNode
}) {
  const eventView = useEventViewForTrack(trackId)

  useSyncEventViewWithScroll(eventView)

  return (
    <EventViewContext.Provider value={eventView}>
      {children}
    </EventViewContext.Provider>
  )
}

export function useEventView(
  eventView: EventView<TrackEvent> = useContext(EventViewContext),
) {
  return useSyncExternalStore(eventView.subscribe, eventView.getEvents)
}
