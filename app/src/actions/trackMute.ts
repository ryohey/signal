import { useSong } from "../hooks/useSong"
import { useStores } from "../hooks/useStores"
import { TrackId } from "../track"

export const useToggleMuteTrack = () => {
  const { trackMute, player } = useStores()
  const song = useSong()

  return (trackId: TrackId) => {
    const channel = song.getTrack(trackId)?.channel
    if (channel === undefined) {
      return
    }

    if (trackMute.isMuted(trackId)) {
      trackMute.unmute(trackId)
    } else {
      trackMute.mute(trackId)
      player.allSoundsOffChannel(channel)
    }
  }
}

export const useToggleSoloTrack = () => {
  const { trackMute, player } = useStores()
  const song = useSong()

  return (trackId: TrackId) => {
    const channel = song.getTrack(trackId)?.channel
    if (channel === undefined) {
      return
    }

    if (trackMute.isSolo(trackId)) {
      trackMute.unsolo(trackId)
      player.allSoundsOffChannel(channel)
    } else {
      trackMute.solo(trackId)
      player.allSoundsOffExclude(channel)
    }
  }
}
