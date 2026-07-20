import { getEventsByIdsOrAll } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useMemo } from "react"
import { useTrackQuery } from "../../../hooks/useTrackQuery"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"

export function useEventList() {
  return {
    get events() {
      const { selectedTrackId, selectedNoteIds } = usePianoRoll()
      const queryTrack = useTrackQuery(selectedTrackId)
      const query = useMemo(
        () => getEventsByIdsOrAll(selectedNoteIds),
        [selectedNoteIds],
      )
      return useMemo(() => {
        return queryTrack(query) ?? []
      }, [queryTrack, query])
    },
    get isOpen() {
      return useAtomValue(showEventListAtom)
    },
    setOpen: useSetAtom(showEventListAtom),
  }
}

// atoms
const showEventListAtom = atom<boolean>(false)
