import {
  isEventOverlapRange,
  isNoteEvent,
  isProgramChangeEvent,
  type TrackEvent,
} from "@signal-app/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useEffect } from "react"
import { useSong } from "../../../hooks/useSong"
import { tickRangeAtom } from "../../../hooks/useTickScroll"
import { usePianoRoll } from "./usePianoRoll"

// create shared cache for events in the piano roll
export function EventViewProvider({ children }: { children: React.ReactNode }) {
  const { selectedTrackId } = usePianoRoll()
  const setEvents = useSetAtom(eventsAtom)
  const song = useSong()
  const track = song.getTrack(selectedTrackId)

  useEffect(() => {
    const update = () => setEvents([...(track?.events ?? [])])
    update()
    return track?.onEventsChanged.subscribe(update) ?? (() => {})
  }, [track, setEvents])

  return children
}

export function useProgramChangeEvents() {
  return useAtomValue(programChangeEventsAtom)
}

export function useNoteEvents() {
  return useAtomValue(noteEventsAtom)
}

// atom
const eventsAtom = atom<readonly TrackEvent[]>([])
const windowedEventsAtom = atom((get) => {
  const events = get(eventsAtom)
  const range = get(tickRangeAtom)
  return events.filter(isEventOverlapRange(range))
})
const programChangeEventsAtom = atom((get) =>
  get(windowedEventsAtom).filter(isProgramChangeEvent),
)
const noteEventsAtom = atom((get) =>
  get(windowedEventsAtom).filter(isNoteEvent),
)
