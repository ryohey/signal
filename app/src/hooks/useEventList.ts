import { atom, useAtomValue, useSetAtom } from "jotai"
import { isEqual } from "lodash"
import { toJS } from "mobx"
import { useMobxSelector } from "./useMobxSelector"
import { usePianoRoll } from "./usePianoRoll"
import { useTrack } from "./useTrack"

export function useEventList() {
  return {
    get events() {
      const { selectedTrackId, selectedNoteIds } = usePianoRoll()
      const { events: trackEvents } = useTrack(selectedTrackId)
      return useMobxSelector(
        () => {
          if (selectedNoteIds.length > 0) {
            return trackEvents.filter(
              (event) => selectedNoteIds.indexOf(event.id) >= 0
            )
          }
          return toJS(trackEvents)
        },
        [trackEvents, selectedNoteIds],
        isEqual
      )
    },
    get isOpen() {
      return useAtomValue(showEventListAtom)
    },
    setOpen: useSetAtom(showEventListAtom),
  }
}

// atoms
const showEventListAtom = atom<boolean>(false)
