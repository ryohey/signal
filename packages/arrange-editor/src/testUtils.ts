import {
  type NoteEvent,
  Song,
  Track,
  type TrackEventOf,
} from "@signal-app/core"
import type { ControllerEvent } from "midifile-ts"
import { SongArrangeEditor } from "./SongArrangeEditor"

export const createSongArrangeEditor = (
  trackCount = 2,
): { editor: SongArrangeEditor; song: Song; tracks: readonly Track[] } => {
  const song = new Song()
  for (let i = 0; i < trackCount; i++) {
    const track = new Track()
    // Track.addEvents drops "channel"-type events (including notes) on the
    // conductor track, and a Song's first-ever track defaults to being the
    // conductor track (no channel assigned). Give every test track an
    // explicit channel so none of them accidentally becomes the conductor.
    track.channel = i
    song.addTrack(track)
  }
  return { editor: new SongArrangeEditor(song), song, tracks: song.tracks }
}

export const addNoteToTrack = (
  track: Track,
  note: { tick: number; duration?: number; noteNumber?: number },
) =>
  track.addEvents<NoteEvent>([
    {
      type: "channel",
      subtype: "note",
      tick: note.tick,
      duration: note.duration ?? 10,
      noteNumber: note.noteNumber ?? 60,
      velocity: 100,
    },
  ])[0]

export const addControllerToTrack = (
  track: Track,
  controller: { tick: number; value?: number },
) =>
  track.addEvents<TrackEventOf<ControllerEvent>>([
    {
      type: "channel",
      subtype: "controller",
      controllerType: 11,
      tick: controller.tick,
      value: controller.value ?? 64,
    },
  ])[0]
