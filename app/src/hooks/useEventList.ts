import { useMemo } from "react"
import { usePianoRoll } from "./usePianoRoll"
import { useTrack } from "./useTrack"

export function useEventList() {
  const { selectedTrackId, selectedNoteIds } = usePianoRoll()
  const { events: trackEvents } = useTrack(selectedTrackId)
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
