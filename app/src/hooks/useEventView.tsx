import { toJS } from "mobx"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react"
import { EventView } from "../observer/EventView"
import Song from "../song"
import { TrackEvent, TrackId } from "../track"
import { useStores } from "./useStores"
import { useTickScroll } from "./useTickScroll"

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
  const fetchEvents = useCallback(
    (song: Song) => toJS(song.getTrack(trackId)?.events) ?? [],
    [trackId],
  )
  return useEventViewInternal(fetchEvents)
}

export function useEventViewInternal<
  T extends {
    tick: number
  },
>(fetchEvents: (song: Song) => readonly T[]) {
  const { songStore } = useStores()
  const eventViewRef = useRef<EventView<T> | null>(null)

  const eventView = useMemo(() => {
    eventViewRef.current?.dispose()
    const newEventView = new EventView<T>(() => fetchEvents(songStore.song))
    eventViewRef.current = newEventView
    return newEventView
  }, [songStore, fetchEvents])

  useEffect(() => {
    return () => {
      if (eventViewRef.current) {
        eventViewRef.current.dispose()
        eventViewRef.current = null
      }
    }
  }, [fetchEvents])

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
