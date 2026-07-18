import { emptyTrack, Song, TrackId } from "../entities"

export const addNewTrack = (song: Song) => () => {
  const channel = Math.min(song.tracks.length - 1, 0xf)
  const newTrack = emptyTrack(channel)
  song.addTrack(newTrack)
}

export const insertNewTrack = (song: Song) => (index: number) => {
  const channel = Math.min(song.tracks.length - 1, 0xf)
  const newTrack = emptyTrack(channel)
  song.insertTrack(newTrack, index)
}

export const duplicateTrack = (song: Song) => (trackId: TrackId) => {
  const track = song.getTrack(trackId)
  if (!track) {
    return
  }
  const trackIndex = song.tracks.findIndex((t) => t.id === trackId)
  const newTrack = track.clone()
  newTrack.channel = undefined
  song.insertTrack(newTrack, trackIndex + 1)
}

export const moveTrack = (song: Song) => (id: TrackId, overId: TrackId) => {
  const track = song.getTrack(id)
  const overTrack = song.getTrack(overId)
  if (track === undefined || overTrack === undefined) {
    return
  }
  const fromIndex = song.tracks.indexOf(track)
  const toIndex = song.tracks.indexOf(overTrack)
  song.moveTrack(fromIndex, toIndex)
}
