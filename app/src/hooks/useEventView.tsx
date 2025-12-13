import type { TrackEvent, TrackId } from "@signal-app/core"
import { toJS } from "mobx"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react"
import { EventView } from "../observer/EventView"
import { useDisposable } from "./useDisposable"
import { useStores } from "./useStores"
import { useTickScroll } from "./useTickScroll"

// biome-ignore lint/style/noNonNullAssertion: this is safe because of the provider
const EventViewContext = createContext<EventView<TrackEvent>>(null!)

export function useSyncEventViewWithScroll<T extends { tick: number }>(
  eventView: EventView<T>
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
    () =>
      new EventView(() => toJS(songStore.song.getTrack(trackId)?.events) ?? []),
    [songStore, trackId]
  )
  return useDisposable(createEventView)
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
  eventView: EventView<TrackEvent> = useContext(EventViewContext)
) {
  return useSyncExternalStore(eventView.subscribe, eventView.getEvents)
}
