import { Track, TrackId } from "../entities"

export interface ISong {
  readonly tracks: readonly Track[]
  readonly conductorTrack: Track | undefined
  getTrack(trackId: TrackId): Track | undefined
}

export interface ISongStore {
  readonly song: ISong
}