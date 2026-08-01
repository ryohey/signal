import { getEventsByIdsOrAll, TrackEvent } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useMemo } from "react"
import { useSyncTrackQuery } from "../../../hooks/useSyncTrackQuery"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"

export function useEventList() {
  return {
    get events() {
      const { selectedTrackId, selectedNoteIds } = usePianoRoll()
      const query = useMemo(
        () => getEventsByIdsOrAll(selectedNoteIds),
        [selectedNoteIds],
      )
      const predicate = useMemo(
        () => (event: TrackEvent) =>
          selectedNoteIds.length > 0
            ? selectedNoteIds.includes(event.id)
            : true,
        [selectedNoteIds],
      )
      return useSyncTrackQuery(selectedTrackId, query, predicate) ?? []
    },
    get isOpen() {
      return useAtomValue(showEventListAtom)
    },
    setOpen: useSetAtom(showEventListAtom),
  }
}

// atoms
const showEventListAtom = atom<boolean>(false)
