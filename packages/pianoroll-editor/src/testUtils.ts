import { Track } from "@signal-app/core"
import { TrackNoteMapper } from "./TrackNoteMapper"

export const createTrackNoteMapper = (): TrackNoteMapper => {
  const track = new Track()
  track.channel = 0
  return new TrackNoteMapper(track)
}
