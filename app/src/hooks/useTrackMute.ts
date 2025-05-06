import { useCallback } from "react"
import { TrackId } from "../track"
import { TrackMute } from "../trackMute/TrackMute"
import { useMobxStore } from "./useMobxSelector"
import { usePlayer } from "./usePlayer"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

export function useTrackMute() {
  const { trackMuteStore } = useStores()
  const trackMute = useMobxStore(
    ({ trackMuteStore }) => trackMuteStore.trackMute,
  )
  const { getChannelForTrack } = useSong()
  const { allSoundsOffChannel, allSoundsOffExclude } = usePlayer()
  const setTrackMute = useCallback(
    (trackMute: TrackMute) => {
      trackMuteStore.trackMute = trackMute
    },
    [trackMuteStore],
  )

  const mute = useCallback(
    (trackId: TrackId) => setTrackMute(TrackMute.mute(trackMute, trackId)),
    [setTrackMute, trackMute],
  )

  const unmute = useCallback(
    (trackId: TrackId) => setTrackMute(TrackMute.unmute(trackMute, trackId)),
    [setTrackMute, trackMute],
  )

  const solo = useCallback(
    (trackId: TrackId) => setTrackMute(TrackMute.solo(trackMute, trackId)),
    [setTrackMute, trackMute],
  )
  const unsolo = useCallback(
    (trackId: TrackId) => setTrackMute(TrackMute.unsolo(trackMute, trackId)),
    [setTrackMute, trackMute],
  )

  return {
    trackMute,
    mute,
    unmute,
    solo,
    unsolo,
    reset: useCallback(() => {
      setTrackMute({ solos: {}, mutes: {} })
    }, [setTrackMute]),
    toggleMute: useCallback(
      (trackId: TrackId) => {
        const channel = getChannelForTrack(trackId)
        if (channel === undefined) {
          return
        }

        if (TrackMute.isMuted(trackMute, trackId)) {
          unmute(trackId)
        } else {
          mute(trackId)
          allSoundsOffChannel(channel)
        }
      },
      [trackMute, getChannelForTrack, allSoundsOffChannel, mute, unmute],
    ),
    toggleSolo: useCallback(
      (trackId: TrackId) => {
        const channel = getChannelForTrack(trackId)
        if (channel === undefined) {
          return
        }

        if (TrackMute.isSolo(trackMute, trackId)) {
          unsolo(trackId)
          allSoundsOffChannel(channel)
        } else {
          solo(trackId)
          allSoundsOffExclude(channel)
        }
      },
      [
        trackMute,
        getChannelForTrack,
        allSoundsOffChannel,
        allSoundsOffExclude,
        solo,
        unsolo,
      ],
    ),
  }
}
