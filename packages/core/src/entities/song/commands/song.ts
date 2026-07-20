import { TrackId } from "../../track"
import { emptyTrack } from "../../track/TrackFactory"
import { SongCommand } from "./type"

export const addNewTrack = (): SongCommand<void> => (song) => {
  const channel = Math.min(song.tracks.length - 1, 0xf)
  const newTrack = emptyTrack(channel)
  song.addTrack(newTrack)
}

export const insertNewTrack =
  (index: number): SongCommand<void> =>
  (song) => {
    const channel = Math.min(song.tracks.length - 1, 0xf)
    const newTrack = emptyTrack(channel)
    song.insertTrack(newTrack, index)
  }

export const duplicateTrack =
  (trackId: TrackId): SongCommand<void> =>
  (song) => {
    const track = song.getTrack(trackId)
    if (!track) {
      return
    }
    const trackIndex = song.tracks.findIndex((t) => t.id === trackId)
    const newTrack = track.clone()
    newTrack.channel = undefined
    song.insertTrack(newTrack, trackIndex + 1)
  }

export const moveTrack =
  (id: TrackId, overId: TrackId): SongCommand<void> =>
  (song) => {
    const track = song.getTrack(id)
    const overTrack = song.getTrack(overId)
    if (track === undefined || overTrack === undefined) {
      return
    }
    const fromIndex = song.tracks.indexOf(track)
    const toIndex = song.tracks.indexOf(overTrack)
    song.moveTrack(fromIndex, toIndex)
  }
