import { useCallback } from "react"
import Song from "../song"
import Track, { TrackId } from "../track"
import { useMobxGetter, useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export const useSong = () => {
  const { songStore } = useStores()
  const song = useMobxStore(({ songStore }) => songStore.song)

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
      [song],
    ),
    setSaved: useCallback(
      (saved: boolean) => {
        song.isSaved = saved
      },
      [song],
    ),
    setFilepath: useCallback(
      (filepath: string) => {
        song.filepath = filepath
      },
      [song],
    ),
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
