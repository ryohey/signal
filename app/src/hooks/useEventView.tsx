import { toJS } from "mobx"
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react"
import { EventView } from "../observer/EventView"
import { TrackEvent, TrackId } from "../track"
import { useStores } from "./useStores"
import { useTickScroll } from "./useTickScroll"

const EventViewContext = createContext<EventView<TrackEvent>>(null!)

export function useSycnEventViewWithScroll(eventView: EventView<TrackEvent>) {
  const { canvasWidth, scrollLeft, transform: tickTransform } = useTickScroll()
  const startTick = tickTransform.getTick(scrollLeft)
  const endTick = tickTransform.getTick(scrollLeft + canvasWidth)

  useEffect(() => {
    eventView.setRange(startTick, endTick)
  }, [eventView, startTick, endTick])
}

export function useEventViewForTrack(trackId: TrackId) {
  const { songStore } = useStores()
  const eventViewRef = useRef<EventView<TrackEvent> | null>(null)

  const eventView = useMemo(() => {
    eventViewRef.current?.dispose()
    const newEventView = new EventView<TrackEvent>(
      () => toJS(songStore.song.getTrack(trackId)?.events) ?? [],
    )
    eventViewRef.current = newEventView
    return newEventView
  }, [songStore, trackId])

  useEffect(() => {
    return () => {
      if (eventViewRef.current) {
        eventViewRef.current.dispose()
        eventViewRef.current = null
      }
    }
  }, [trackId])

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

  useSycnEventViewWithScroll(eventView)

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
