import { useCallback } from "react"
import { TrackId } from "../track"
import { usePlayer } from "./usePlayer"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

export function useTrackMute() {
  const { trackMute } = useStores()
  const song = useSong()
  const { allSoundsOffChannel, allSoundsOffExclude } = usePlayer()

  return {
    toggleMuteTrack: useCallback(
      (trackId: TrackId) => {
        const channel = song.getTrack(trackId)?.channel
        if (channel === undefined) {
          return
        }

        if (trackMute.isMuted(trackId)) {
          trackMute.unmute(trackId)
        } else {
          trackMute.mute(trackId)
          allSoundsOffChannel(channel)
        }
      },
      [trackMute, song, allSoundsOffChannel],
    ),
    toggleSoloTrack: useCallback(
      (trackId: TrackId) => {
        const channel = song.getTrack(trackId)?.channel
        if (channel === undefined) {
          return
        }

        if (trackMute.isSolo(trackId)) {
          trackMute.unsolo(trackId)
          allSoundsOffChannel(channel)
        } else {
          trackMute.solo(trackId)
          allSoundsOffExclude(channel)
        }
      },
      [trackMute, song, allSoundsOffChannel, allSoundsOffExclude],
    ),
  }
}
