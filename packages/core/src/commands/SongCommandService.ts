import { emptyTrack, Song, TrackId } from "../entities"
import { ISongStore } from "./interfaces"

const addNewTrack = (song: Song) => () => {
  const channel = Math.min(song.tracks.length - 1, 0xf)
  const newTrack = emptyTrack(channel)
  song.addTrack(newTrack)
}

const insertNewTrack = (song: Song) => (index: number) => {
  const channel = Math.min(song.tracks.length - 1, 0xf)
  const newTrack = emptyTrack(channel)
  song.insertTrack(newTrack, index)
}

const duplicateTrack = (song: Song) => (trackId: TrackId) => {
  const track = song.getTrack(trackId)
  if (!track) {
    return
  }
  const trackIndex = song.tracks.findIndex((t) => t.id === trackId)
  const newTrack = track.clone()
  newTrack.channel = undefined
  song.insertTrack(newTrack, trackIndex + 1)
}

const moveTrack = (song: Song) => (id: TrackId, overId: TrackId) => {
  const track = song.getTrack(id)
  const overTrack = song.getTrack(overId)
  if (track === undefined || overTrack === undefined) {
    return
  }
  const fromIndex = song.tracks.indexOf(track)
  const toIndex = song.tracks.indexOf(overTrack)
  song.moveTrack(fromIndex, toIndex)
}

export function createSongCommandService(songStore: ISongStore) {
  function bindSong<Args extends unknown[], Result>(
    command: (song: Song) => (...args: Args) => Result,
  ): (...args: Args) => Result {
    return (...args: Args) => {
      const song = songStore.song
      return command(song)(...args)
    }
  }

  return {
    addNewTrack: bindSong(addNewTrack),
    insertNewTrack: bindSong(insertNewTrack),
    duplicateTrack: bindSong(duplicateTrack),
    moveTrack: bindSong(moveTrack),
  }
}

export type SongCommandService = ReturnType<typeof createSongCommandService>
