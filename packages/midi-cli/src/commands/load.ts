import {
  contextFromSong,
  loadMidiFile,
  notesFromTrack,
  writeNoteStream,
} from "../io.js"

export interface LoadOptions {
  track?: string
}

export function loadCommand(filePath: string, options: LoadOptions): void {
  const song = loadMidiFile(filePath)
  const context = contextFromSong(song)

  const trackIndex = options.track ? parseInt(options.track, 10) - 1 : 0

  if (trackIndex < 0 || trackIndex >= song.tracks.length) {
    throw new Error(
      `Track ${trackIndex + 1} does not exist. Song has ${song.tracks.length} tracks.`,
    )
  }

  const track = song.tracks[trackIndex]
  const notes = notesFromTrack(track.events, track.channel)

  writeNoteStream({ context, notes })
}
