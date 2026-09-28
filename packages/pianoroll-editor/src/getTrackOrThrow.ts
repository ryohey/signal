import type { Song, Track, TrackId } from "@signal-app/core"

export const getTrackOrThrow = (song: Song, trackId: TrackId): Track => {
  const track = song.getTrack(trackId)
  if (track === undefined) {
    throw new Error(`Track ${trackId} not found`)
  }
  return track
}
