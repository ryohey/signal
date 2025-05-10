import { makeObservable, observable } from "mobx"
import { createContext, useCallback, useContext, useMemo } from "react"
import { TrackId } from "../track"
import { TrackMute } from "../trackMute/TrackMute"
import { useMobxSelector } from "./useMobxSelector"
import { usePlayer } from "./usePlayer"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

class TrackMuteStore {
  trackMute: TrackMute = {
    mutes: {},
    solos: {},
  }

  constructor() {
    makeObservable(this, {
      trackMute: observable.ref,
    })
  }
}

const TrackMuteStoreContext = createContext<TrackMuteStore>(null!)

export function TrackMuteProvider({ children }: { children: React.ReactNode }) {
  const trackMuteStore = useMemo(() => new TrackMuteStore(), [])

  return (
    <TrackMuteStoreContext.Provider value={trackMuteStore}>
      {children}
    </TrackMuteStoreContext.Provider>
  )
}

export function useTrackMute() {
  const trackMuteStore = useContext(TrackMuteStoreContext)
  const { synthGroup } = useStores()
  const trackMute = useMobxSelector(
    () => trackMuteStore.trackMute,
    [trackMuteStore],
  )
  const { getChannelForTrack } = useSong()
  const { allSoundsOffChannel, allSoundsOffExclude } = usePlayer()
  const setTrackMute = useCallback(
    (trackMute: TrackMute) => {
      trackMuteStore.trackMute = trackMute

      // sync with synth group
      synthGroup.trackMute = trackMute
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
