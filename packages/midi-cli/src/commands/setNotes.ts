import { isNoteEvent, type TrackEvent } from "@signal-app/core"
import {
  contextFromSong,
  loadMidiFile,
  readNoteStream,
  saveMidiFile,
} from "../io.js"
import { parsePosition } from "../parse/position.js"

export interface SetNotesOptions {
  track?: string
  from?: string
  to?: string
  merge?: boolean
}

export async function setNotesCommand(
  filePath: string,
  options: SetNotesOptions,
): Promise<void> {
  const stream = await readNoteStream()
  const song = loadMidiFile(filePath)
  const context = contextFromSong(song)

  const trackIndex = options.track ? parseInt(options.track, 10) - 1 : 0

  if (trackIndex < 0 || trackIndex >= song.tracks.length) {
    throw new Error(
      `Track ${trackIndex + 1} does not exist. Song has ${song.tracks.length} tracks.`,
    )
  }

  const track = song.tracks[trackIndex]

  if (!options.merge) {
    // Replace mode: remove existing notes in the range
    // Use explicit --from/--to options first, then fall back to selection
    // metadata from upstream commands (e.g., get-notes), then full range
    const selection = stream.context.selection

    let fromTick = selection?.fromTick ?? 0
    let toTick = selection?.toTick ?? Number.POSITIVE_INFINITY

    if (options.from) {
      fromTick = parsePosition(options.from, context.timebase, context.measures)
    }
    if (options.to) {
      toTick = parsePosition(options.to, context.timebase, context.measures)
    }

    const idsToRemove = track.events
      .filter(isNoteEvent)
      .filter((e) => e.tick >= fromTick && e.tick < toTick)
      .map((e) => e.id)

    track.removeEvents(idsToRemove)
  }

  // Add the new notes from the stream
  for (const note of stream.notes) {
    track.addEvent({
      type: "channel",
      subtype: "note",
      tick: note.tick,
      duration: note.duration,
      noteNumber: note.noteNumber,
      velocity: note.velocity,
    } as unknown as Omit<TrackEvent, "id">)
  }

  track.updateEndOfTrack()
  song.updateEndOfSong()

  saveMidiFile(song, filePath)

  process.stderr.write(
    `Wrote ${stream.notes.length} notes to track ${trackIndex + 1} in ${filePath}\n`,
  )
}
