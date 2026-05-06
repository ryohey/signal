import { emptyTrack, TrackId } from "../entities"
import { ISongStore } from "./interfaces"

export class SongCommandService {
  constructor(private readonly songStore: ISongStore) {}

  addNewTrack = () => {
    const { song } = this.songStore
    const channel = Math.min(song.tracks.length - 1, 0xf)
    const newTrack = emptyTrack(channel)
    song.addTrack(newTrack)
  }

  insertNewTrack = (index: number) => {
    const { song } = this.songStore
    const channel = Math.min(song.tracks.length - 1, 0xf)
    const newTrack = emptyTrack(channel)
    song.insertTrack(newTrack, index)
  }

  duplicateTrack = (trackId: TrackId) => {
    const { song } = this.songStore
    const track = song.getTrack(trackId)
    if (!track) {
      return
    }
    const trackIndex = song.tracks.findIndex((t) => t.id === trackId)
    const newTrack = track.clone()
    newTrack.channel = undefined
    song.insertTrack(newTrack, trackIndex + 1)
  }

  moveTrack = (id: TrackId, overId: TrackId) => {
    const { song } = this.songStore
    const track = song.getTrack(id)
    const overTrack = song.getTrack(overId)
    if (track === undefined || overTrack === undefined) {
      return
    }
    const fromIndex = song.tracks.indexOf(track)
    const toIndex = song.tracks.indexOf(overTrack)
    song.moveTrack(fromIndex, toIndex)
  }
}
