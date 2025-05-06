import { useCallback } from "react"
import { TrackId } from "../track"
import { useSong } from "./useSong"

export function useTrackList() {
  const { tracks, getTrack, moveTrack } = useSong()
  const trackIds = tracks
    .filter((track) => !track.isConductorTrack)
    .map((track) => track.id)

  return {
    trackIds,
    moveTrack: useCallback(
      (id: TrackId, overId: TrackId) => {
        const track = getTrack(id)
        const overTrack = getTrack(overId)
        if (track === undefined || overTrack === undefined) {
          return
        }
        const fromIndex = tracks.indexOf(track)
        const toIndex = tracks.indexOf(overTrack)
        moveTrack(fromIndex, toIndex)
      },
      [tracks, getTrack, moveTrack],
    ),
  }
}
