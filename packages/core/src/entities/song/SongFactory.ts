import { conductorTrack, emptyTrack } from "../track"
import { Song } from "./Song"

export function emptySong() {
  const song = new Song()
  song.addTrack(conductorTrack())
  song.addTrack(emptyTrack(0))
  // Empty songs do not need to be saved.
  song.isSaved = true
  return song
}
