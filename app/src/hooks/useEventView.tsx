import { toJS } from "mobx"
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react"
import { EventView } from "../observer/EventView"
import { TrackEvent, TrackId } from "../track"
import { useStores } from "./useStores"
import { useTickScroll } from "./useTickScroll"

const EventViewContext = createContext<EventView<TrackEvent>>(null!)

export type EventFilter<T extends TrackEvent> = (
  trackEvent: TrackEvent,
) => trackEvent is T

export function EventViewProvider({
  trackId,
  children,
}: {
  trackId: TrackId
  children: React.ReactNode
}) {
  const { songStore } = useStores()
  const eventView = useMemo(
    () =>
      new EventView<TrackEvent>(
        () => toJS(songStore.song.getTrack(trackId)?.events) ?? [],
      ),
    [songStore, trackId],
  )

  const { canvasWidth, scrollLeft, transform: tickTransform } = useTickScroll()
  const startTick = tickTransform.getTick(scrollLeft)
  const endTick = tickTransform.getTick(scrollLeft + canvasWidth)

  useEffect(() => {
    eventView.setRange(startTick, endTick)
  }, [eventView, startTick, endTick])

  return (
    <EventViewContext.Provider value={eventView}>
      {children}
    </EventViewContext.Provider>
  )
}

export function useEventView() {
  const eventView = useContext(EventViewContext)
  return useSyncExternalStore(eventView.subscribe, eventView.getEvents)
}
