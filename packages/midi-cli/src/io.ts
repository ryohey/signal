import fs from "node:fs"
import {
  isNoteEvent,
  isTimeSignatureEvent,
  Measure,
  type NoteEvent,
  Song,
  songFromMidi,
  songToMidi,
  type TrackEvent,
} from "@signal-app/core"
import type { NoteStream, NoteStreamContext, SerializedNote } from "./types.js"

/** Read all of stdin as a string */
export function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk))
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString()))
    process.stdin.on("error", reject)
  })
}

/** Read a NoteStream from stdin (piped JSON) */
export async function readNoteStream(): Promise<NoteStream> {
  const raw = await readStdin()
  try {
    return JSON.parse(raw) as NoteStream
  } catch {
    throw new Error(
      "Failed to parse NoteStream from stdin. Expected JSON input from a previous command in the pipeline.",
    )
  }
}

/** Write a NoteStream to stdout as JSON */
export function writeNoteStream(stream: NoteStream): void {
  process.stdout.write(JSON.stringify(stream, null, 2))
}

/** Load a Song from a MIDI file path */
export function loadMidiFile(filePath: string): Song {
  const data = fs.readFileSync(filePath)
  return songFromMidi(data as unknown as Parameters<typeof songFromMidi>[0])
}

/** Save a Song to a MIDI file path */
export function saveMidiFile(song: Song, filePath: string): void {
  const data = songToMidi(song)
  fs.writeFileSync(filePath, Buffer.from(data))
}

/** Extract the NoteStreamContext from a Song (timebase + measures) */
export function contextFromSong(song: Song): NoteStreamContext {
  const conductorTrack = song.conductorTrack
  const timeSignatureEvents = conductorTrack
    ? conductorTrack.events.filter(isTimeSignatureEvent)
    : []

  const measures = Measure.fromTimeSignatures(
    timeSignatureEvents.map((e) => ({
      tick: e.tick,
      numerator: e.numerator,
      denominator: e.denominator,
    })),
    song.timebase,
  )

  return {
    timebase: song.timebase,
    measures: measures.map((m) => ({
      tick: m.tick,
      measure: m.measure,
      numerator: m.numerator,
      denominator: m.denominator,
    })),
  }
}

/** Extract SerializedNote[] from a track's events */
export function notesFromTrack(
  events: readonly TrackEvent[],
  channel?: number,
): SerializedNote[] {
  return events.filter(isNoteEvent).map((e: NoteEvent) => ({
    tick: e.tick,
    duration: e.duration,
    noteNumber: e.noteNumber,
    velocity: e.velocity,
    ...(channel !== undefined ? { channel } : {}),
    id: e.id,
  }))
}

/** Check if stdin is a TTY (i.e., no piped input) */
export function hasStdinInput(): boolean {
  return !process.stdin.isTTY
}
