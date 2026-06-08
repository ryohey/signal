import { atom, useAtomValue, useSetAtom } from "jotai"
import { useMemo } from "react"
import { useTrack } from "../../../hooks/useTrack"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"

export function useEventList() {
  return {
    get events() {
      const { selectedTrackId, selectedNoteIds } = usePianoRoll()
      const { events: trackEvents } = useTrack(selectedTrackId)
      return useMemo(() => {
        if (selectedNoteIds.length > 0) {
          return trackEvents.filter(
            (event) => selectedNoteIds.indexOf(event.id) >= 0,
          )
        }
        return trackEvents
      }, [trackEvents, selectedNoteIds])
    },
    get isOpen() {
      return useAtomValue(showEventListAtom)
    },
    setOpen: useSetAtom(showEventListAtom),
  }
}

// atoms
const showEventListAtom = atom<boolean>(false)
