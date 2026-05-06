import { Song, TrackId } from "@signal-app/core"
import { useCallback, useSyncExternalStore } from "react"
import { useStores } from "./useStores"

export const useSong = () => {
  const { songStore } = useStores()
  const song = useSyncExternalStore(
    songStore.onSongChanged.subscribe,
    useCallback(() => songStore.song, [songStore]),
  )

  return {
    get name() {
      return useSyncExternalStore(
        song.onNameChanged.subscribe,
        useCallback(() => song.name, [song]),
      )
    },
    get timebase() {
      return useSyncExternalStore(
        song.onTimebaseChanged.subscribe,
        useCallback(() => song.timebase, [song]),
      )
    },
    get measures() {
      return useSyncExternalStore(
        song.onMeasuresChanged.subscribe,
        useCallback(() => song.measures, [song]),
      )
    },
    get timeSignatures() {
      return useSyncExternalStore(
        song.onTimeSignaturesChanged.subscribe,
        useCallback(() => song.timeSignatures, [song]),
      )
    },
    get tracks() {
      return useSyncExternalStore(
        song.onTracksChanged.subscribe,
        song.getTracksSnapshot,
      )
    },
    get isSaved() {
      return useSyncExternalStore(
        song.onIsSavedChanged.subscribe,
        useCallback(() => song.isSaved, [song]),
      )
    },
    get filepath() {
      return useSyncExternalStore(
        song.onFilepathChanged.subscribe,
        useCallback(() => song.filepath, [song]),
      )
    },
    get fileHandle() {
      return useSyncExternalStore(
        song.onFilepathChanged.subscribe,
        useCallback(() => song.fileHandle, [song]),
      )
    },
    get cloudSongId() {
      return useSyncExternalStore(
        song.onCloudSongIdChanged.subscribe,
        useCallback(() => song.cloudSongId, [song]),
      )
    },
    get endOfSong() {
      return useSyncExternalStore(
        song.onEndOfSongChanged.subscribe,
        useCallback(() => song.endOfSong, [song]),
      )
    },
    get conductorTrack() {
      return useSyncExternalStore(
        song.onConductorTrackChanged.subscribe,
        useCallback(() => song.conductorTrack, [song]),
      )
    },
    setName: useCallback(
      (name: string) => {
        song.name = name
      },
      [song],
    ),
    getSong: useCallback(() => songStore.song, [songStore]),
    setSong: useCallback(
      (song: Song) => {
        songStore.song = song
      },
      [songStore],
    ),
    setSaved: useCallback(
      (isSaved: boolean) => {
        song.isSaved = isSaved
      },
      [song],
    ),
    setFilepath: useCallback(
      (filepath: string) => {
        song.filepath = filepath
      },
      [song],
    ),
    removeTrack: useCallback(
      (trackId: TrackId) => {
        song.removeTrack(trackId)
      },
      [song],
    ),
    getTrack: useCallback(
      (trackId: TrackId) => {
        return song.getTrack(trackId)
      },
      [song],
    ),
    getChannelForTrack: useCallback(
      (trackId: TrackId) => {
        return song.getTrack(trackId)?.channel
      },
      [song],
    ),
    updateEndOfSong: useCallback(() => {
      song.updateEndOfSong()
    }, [song]),
  }
}
