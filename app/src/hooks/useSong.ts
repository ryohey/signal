import { useCallback } from "react"
import Song from "../song"
import Track, { TrackId } from "../track"
import { useMobxSelector, useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export const useSong = () => {
  const { songStore } = useStores()
  const song = useMobxStore(({ songStore }) => songStore.song)

  return {
    get name() {
      return useMobxSelector(() => song.name, [song])
    },
    get timebase() {
      return useMobxSelector(() => song.timebase, [song])
    },
    get measures() {
      return useMobxSelector(() => song.measures, [song])
    },
    get timeSignatures() {
      return useMobxSelector(() => song.timeSignatures, [song])
    },
    get tracks() {
      return useMobxSelector(() => song.tracks, [song])
    },
    get isSaved() {
      return useMobxSelector(() => song.isSaved, [song])
    },
    get filepath() {
      return useMobxSelector(() => song.filepath, [song])
    },
    get fileHandle() {
      return useMobxSelector(() => song.fileHandle, [song])
    },
    get cloudSongId() {
      return useMobxSelector(() => song.cloudSongId, [song])
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
