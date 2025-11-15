import { useCallback } from "react"
import Track, { TrackId } from "../track"
import { useMobxGetter, useMobxSetter } from "./useMobxSelector"
import { useStores } from "./useStores"

export const useSong = () => {
  const { songStore } = useStores()
  const song = useMobxGetter(songStore, "song")

  return {
    get name() {
      return useMobxGetter(song, "name")
    },
    get timebase() {
      return useMobxGetter(song, "timebase")
    },
    get measures() {
      return useMobxGetter(song, "measures")
    },
    get timeSignatures() {
      return useMobxGetter(song, "timeSignatures")
    },
    get tracks() {
      return useMobxGetter(song, "tracks")
    },
    get isSaved() {
      return useMobxGetter(song, "isSaved")
    },
    get filepath() {
      return useMobxGetter(song, "filepath")
    },
    get fileHandle() {
      return useMobxGetter(song, "fileHandle")
    },
    get cloudSongId() {
      return useMobxGetter(song, "cloudSongId")
    },
    get endOfSong() {
      return useMobxGetter(song, "endOfSong")
    },
    setName: useMobxSetter(song, "name"),
    getSong: useCallback(() => songStore.song, [songStore]),
    setSong: useMobxSetter(songStore, "song"),
    setSaved: useMobxSetter(song, "isSaved"),
    setFilepath: useMobxSetter(song, "filepath"),
    addTrack: useCallback(
      (track: Track) => {
        song.addTrack(track)
      },
      [song],
    ),
    insertTrack: useCallback(
      (track: Track, index: number) => {
        song.insertTrack(track, index)
      },
      [song],
    ),
    moveTrack: useCallback(
      (from: number, to: number) => {
        song.moveTrack(from, to)
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
    transposeNotes: useCallback(
      (
        deltaPitch: number,
        selectedEventIds: {
          [key: number]: number[] // trackIndex: eventId
        },
      ) => {
        song.transposeNotes(deltaPitch, selectedEventIds)
      },
      [song],
    ),
    updateEndOfSong: useCallback(() => {
      song.updateEndOfSong()
    }, [song]),
  }
}
