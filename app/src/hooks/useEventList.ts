import { useMemo } from "react"
import { useMobxSelector } from "./useMobxSelector"
import { usePianoRoll } from "./usePianoRoll"

export function useEventList() {
  const { selectedTrack, selectedNoteIds } = usePianoRoll()
  const trackEvents = useMobxSelector(
    () => selectedTrack?.events ?? [],
    [selectedTrack],
  )
  const events = useMemo(() => {
    if (selectedNoteIds.length > 0) {
      return trackEvents.filter(
        (event) => selectedNoteIds.indexOf(event.id) >= 0,
      )
    }
    return trackEvents
  }, [trackEvents, selectedNoteIds])

  return {
    events,
  }
}
