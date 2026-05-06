import { TrackId } from "@signal-app/core"
import { atom, useAtomValue, useSetAtom } from "jotai"
import { useCallback } from "react"
import { useCommands } from "./useCommands"
import { useSong } from "./useSong"

export function useTrackList() {
  const { tracks } = useSong()
  const trackIds = tracks
    .filter((track) => !track.isConductorTrack)
    .map((track) => track.id)
  const commands = useCommands()

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
  }
}

// atoms
const isOpenAtom = atom(false)
