import { Song, Track, TrackEventsMutator, TrackId } from "@signal-app/core"
import { useCallback } from "react"
import { useSong } from "./useSong"
import { useStores } from "./useStores"

export function useSongCommand<A extends unknown[], R>(
  cmd: (song: Song) => (...a: A) => R,
): (...a: A) => R {
  const { songStore } = useStores()
  return useCallback((...a: A) => cmd(songStore.song)(...a), [songStore, cmd])
}

export function useTracksCommand<A extends unknown[], R>(
  cmd: (tracks: readonly Track[]) => (...a: A) => R,
): (...a: A) => R {
  const { songStore } = useStores()
  return useCallback(
    (...a: A) => cmd(songStore.song.tracks)(...a),
    [songStore, cmd],
  )
}

export function useConductorTrackCommand<A extends unknown[], R>(
  cmd: (track: Track) => (...a: A) => R,
): (...a: A) => R | undefined {
  const { songStore } = useStores()
  return useCallback(
    (...a: A) => {
      const conductorTrack = songStore.song.conductorTrack
      if (!conductorTrack) {
        return undefined
      }
      return cmd(conductorTrack)(...a)
    },
    [songStore, cmd],
  )
}

export function useMutateTrack(
  trackId: TrackId,
): <R = void>(fn: TrackEventsMutator<R>) => R | undefined {
  const { getTrack } = useSong()
  return useCallback(
    <R = void>(fn: TrackEventsMutator<R>) => {
      const track = getTrack(trackId)
      if (!track) {
        return undefined
      }
      return track.mutate(fn)
    },
    [getTrack, trackId],
  )
}

export function useMutateConductorTrack(): <R = void>(
  fn: TrackEventsMutator<R>,
) => R | undefined {
  const { conductorTrack } = useSong()
  return useCallback(
    <R = void>(fn: TrackEventsMutator<R>) => {
      if (!conductorTrack) {
        return undefined
      }
      return conductorTrack.mutate(fn)
    },
    [conductorTrack],
  )
}
