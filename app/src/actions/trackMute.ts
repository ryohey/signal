import { usePlayer } from "../hooks/usePlayer"
import { useSong } from "../hooks/useSong"
import { useStores } from "../hooks/useStores"
import { TrackId } from "../track"

export const useToggleMuteTrack = () => {
  const { trackMute } = useStores()
  const song = useSong()
  const { allSoundsOffChannel } = usePlayer()

  return (trackId: TrackId) => {
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
  }
}

export const useToggleSoloTrack = () => {
  const { trackMute } = useStores()
  const { allSoundsOffChannel, allSoundsOffExclude } = usePlayer()
  const song = useSong()

  return (trackId: TrackId) => {
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
  }
}
