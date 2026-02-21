import { Song, Track, type TrackEvent } from "@signal-app/core"
import { readNoteStream, saveMidiFile } from "../io.js"

export async function saveCommand(filePath: string): Promise<void> {
  const stream = await readNoteStream()

  const song = new Song()
  song.timebase = stream.context.timebase

  // Create a conductor track with time signatures
  const conductorTrack = new Track()
  for (const m of stream.context.measures) {
    conductorTrack.addEvent({
      type: "meta",
      subtype: "timeSignature",
      tick: m.tick,
      numerator: m.numerator,
      denominator: m.denominator,
      metronome: 24,
      thirtyseconds: 8,
    } as unknown as Omit<TrackEvent, "id">)
  }
  song.addTrack(conductorTrack)

  // Create a track with the notes
  const noteTrack = new Track()
  noteTrack.channel = 0

  for (const note of stream.notes) {
    noteTrack.addEvent({
      type: "channel",
      subtype: "note",
      tick: note.tick,
      duration: note.duration,
      noteNumber: note.noteNumber,
      velocity: note.velocity,
    } as unknown as Omit<TrackEvent, "id">)
  }

  noteTrack.updateEndOfTrack()
  song.addTrack(noteTrack)
  song.updateEndOfSong()

  saveMidiFile(song, filePath)

  process.stderr.write(`Saved ${stream.notes.length} notes to ${filePath}\n`)
}
