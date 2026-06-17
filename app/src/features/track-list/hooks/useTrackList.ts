import { TrackId } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"
import { useCommands } from "../../../hooks/useCommands"
import { useHistory } from "../../../hooks/useHistory"
import { useSong } from "../../../hooks/useSong"

export function useTrackList() {
  const { tracks } = useSong()
  const trackIds = tracks
    .filter((track) => !track.isConductorTrack)
    .map((track) => track.id)
  const commands = useCommands()
  const { pushHistory } = useHistory()

  return {
    get isOpen() {
      return useAtomValue(isOpenAtom)
    },
    setOpen: useSetAtom(isOpenAtom),
    trackIds,
    moveTrack: useCallback(
      (id: TrackId, overId: TrackId) => {
        commands.song.moveTrack(id, overId)
      },
      [commands],
    ),
    addTrack: useCallback(() => {
      pushHistory()
      commands.song.addNewTrack()
    }, [pushHistory, commands]),
  }
}

// atoms
const isOpenAtom = atom(false)
