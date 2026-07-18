import {
  addNewTrack as addNewTrackCmd,
  moveTrack as moveTrackCmd,
  TrackId,
} from "@signal-app/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"
import { useSongCommand } from "../../../hooks/useCommand"
import { useHistory } from "../../../hooks/useHistory"
import { useSong } from "../../../hooks/useSong"

export function useTrackList() {
  const { tracks } = useSong()
  const trackIds = tracks
    .filter((track) => !track.isConductorTrack)
    .map((track) => track.id)
  const addNewTrack = useSongCommand(addNewTrackCmd)
  const moveTrack = useSongCommand(moveTrackCmd)
  const { pushHistory } = useHistory()

  return {
    get isOpen() {
      return useAtomValue(isOpenAtom)
    },
    setOpen: useSetAtom(isOpenAtom),
    trackIds,
    moveTrack: useCallback(
      (id: TrackId, overId: TrackId) => {
        moveTrack(id, overId)
      },
      [moveTrack],
    ),
    addTrack: useCallback(() => {
      pushHistory()
      addNewTrack()
    }, [pushHistory, addNewTrack]),
  }
}

// atoms
const isOpenAtom = atom(false)
