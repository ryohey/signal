import type { TrackId } from "@signal-app/core"
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import { useAtomCallback } from "jotai/utils"
import { atomEffect } from "jotai-effect"
import { useCallback, useMemo } from "react"
import { TrackMute } from "../trackMute/TrackMute"
import { usePlayer } from "./usePlayer"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

export function useTrackMute() {
  const { synthGroup } = useStores()
  const { getTrack } = useSong()
  const { allSoundsOffChannel, allSoundsOffExclude } = usePlayer()

  // sync with synth group
  const syncToSynthEffectAtom = useMemo(
    () =>
      atomEffect((get) => {
        synthGroup.trackMute = get(trackMuteAtom)
      }),
    [synthGroup]
  )

  useAtom(syncToSynthEffectAtom)

  return {
    get trackMute() {
      return useAtomValue(trackMuteAtom)
    },
    mute: useSetAtom(muteAtom),
    unmute: useSetAtom(unmuteAtom),
    solo: useSetAtom(soloAtom),
    unsolo: useSetAtom(unsoloAtom),
    reset: useSetAtom(resetAtom),
    toggleMute: useAtomCallback(
      useCallback(
        (get, set, trackId: TrackId) => {
          const channel = getTrack(trackId)?.channel
          if (channel === undefined) {
            return
          }

          if (TrackMute.isMuted(trackId)(get(trackMuteAtom))) {
            set(trackMuteAtom, TrackMute.unmute(trackId))
          } else {
            set(trackMuteAtom, TrackMute.mute(trackId))
            allSoundsOffChannel(channel)
          }
        },
        [getTrack, allSoundsOffChannel]
      )
    ),
    toggleSolo: useAtomCallback(
      useCallback(
        (get, set, trackId: TrackId) => {
          const channel = getTrack(trackId)?.channel
          if (channel === undefined) {
            return
          }

          if (TrackMute.isSolo(trackId)(get(trackMuteAtom))) {
            set(trackMuteAtom, TrackMute.unsolo(trackId))
            allSoundsOffChannel(channel)
          } else {
            set(trackMuteAtom, TrackMute.solo(trackId))
            allSoundsOffExclude(channel)
          }
        },
        [getTrack, allSoundsOffChannel, allSoundsOffExclude]
      )
    ),
  }
}

// atoms
const trackMuteAtom = atom<TrackMute>(TrackMute.empty)

// actions
const muteAtom = atom(null, (_get, set, trackId: TrackId) =>
  set(trackMuteAtom, TrackMute.mute(trackId))
)
const unmuteAtom = atom(null, (_get, set, trackId: TrackId) =>
  set(trackMuteAtom, TrackMute.unmute(trackId))
)
const soloAtom = atom(null, (_get, set, trackId: TrackId) =>
  set(trackMuteAtom, TrackMute.solo(trackId))
)
const unsoloAtom = atom(null, (_get, set, trackId: TrackId) =>
  set(trackMuteAtom, TrackMute.unsolo(trackId))
)
const resetAtom = atom(null, (_get, set) => set(trackMuteAtom, TrackMute.empty))
