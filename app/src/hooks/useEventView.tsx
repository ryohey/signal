import { isEventOverlapRange, TrackEvent, TrackId } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useEffect } from "react"
import { tickRangeAtom } from "./useTickScroll"
import { useTrack } from "./useTrack"

// create shared cache for events in the piano roll
export function EventViewProvider({
  trackId,
  children,
}: {
  trackId: TrackId
  children: React.ReactNode
}) {
  const setEvents = useSetAtom(eventsAtom)
  const { events } = useTrack(trackId)
  useEffect(() => setEvents(events ?? []), [events, setEvents])
  return children
}

export function useEventView() {
  return useAtomValue(windowedEventsAtom)
}

// atoms
const eventsAtom = atom<readonly TrackEvent[]>([])

// derived atoms
const windowedEventsAtom = atom((get) => {
  const events = get(eventsAtom)
  const range = get(tickRangeAtom)
  return events.filter(isEventOverlapRange(range))
})
