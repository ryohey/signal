import { hasStdinInput, readNoteStream, writeNoteStream } from "../io.js"
import { isChordSymbol, parseChord } from "../parse/chord.js"
import { parseGrid } from "../parse/grid.js"
import { parseNoteSpec } from "../parse/noteRange.js"
import { parsePosition } from "../parse/position.js"
import { parseScale } from "../parse/scale.js"
import { Chord } from "../theory/Chord.js"
import { parseDegree } from "../theory/Degree.js"
import type { NoteStream, SerializedNote } from "../types.js"

export interface AddNotesOptions {
  at?: string
  duration?: string
  each?: string
  velocity?: string
  octave?: string
  strum?: string
  scale?: string
  degree?: string[]
  key?: string
  rest?: boolean
  channel?: string
}

export async function addNotesCommand(
  args: string[],
  options: AddNotesOptions,
): Promise<void> {
  // Read existing stream if piped, or create empty one
  let stream: NoteStream
  if (hasStdinInput()) {
    stream = await readNoteStream()
  } else {
    stream = {
      context: {
        timebase: 480,
        measures: [{ tick: 0, measure: 0, numerator: 4, denominator: 4 }],
      },
      notes: [],
    }
  }

  const { context } = stream
  const timebase = context.timebase

  const velocity = options.velocity ? parseInt(options.velocity, 10) : 100
  const octave = options.octave ? parseInt(options.octave, 10) : 4
  const channel = options.channel ? parseInt(options.channel, 10) : undefined

  // Parse starting position
  let cursor = 0
  if (options.at) {
    cursor = parsePosition(options.at, timebase, context.measures)
  }

  // Parse duration
  const durationStr = options.duration ?? "1/4"
  const durationTicks = parseGrid(durationStr, timebase)

  // Parse --each (time between successive chord/note groups)
  const eachTicks = options.each ? parseGrid(options.each, timebase) : undefined

  // Parse strum offset
  const strumTicks = options.strum ? parseInt(options.strum, 10) : 0

  const newNotes: SerializedNote[] = []

  if (options.rest) {
    // Rest: just advance cursor without adding notes
    if (eachTicks) {
      cursor += eachTicks
    } else {
      cursor += durationTicks
    }
  } else if (options.scale) {
    // Generate scale notes
    const scaleInfo = parseScale(options.scale)
    const pitchClasses = scaleInfo.intervals
    for (const pc of pitchClasses) {
      const noteNumber = (octave + 1) * 12 + pc
      if (noteNumber >= 0 && noteNumber <= 127) {
        newNotes.push({
          tick: cursor,
          duration: durationTicks,
          noteNumber,
          velocity,
          ...(channel !== undefined ? { channel } : {}),
        })
        if (eachTicks) cursor += eachTicks
      }
    }
  } else if (options.degree && options.key) {
    // Generate chords from Roman numeral degrees
    const keyScale = parseScale(options.key)
    for (const deg of options.degree) {
      const info = parseDegree(deg, keyScale.key, keyScale.scale)
      const intervals = Chord.getIntervals(info.chordType)
      for (let i = 0; i < intervals.length; i++) {
        const noteNumber = (octave + 1) * 12 + info.root + intervals[i]
        if (noteNumber >= 0 && noteNumber <= 127) {
          newNotes.push({
            tick: cursor + i * strumTicks,
            duration: durationTicks,
            noteNumber,
            velocity,
            ...(channel !== undefined ? { channel } : {}),
          })
        }
      }
      if (eachTicks) cursor += eachTicks
    }
  } else {
    // Parse positional args as note names or chord symbols
    for (const arg of args) {
      if (isChordSymbol(arg)) {
        const chord = parseChord(arg)
        for (let i = 0; i < chord.intervals.length; i++) {
          const noteNumber = (octave + 1) * 12 + chord.root + chord.intervals[i]
          if (noteNumber >= 0 && noteNumber <= 127) {
            newNotes.push({
              tick: cursor + i * strumTicks,
              duration: durationTicks,
              noteNumber,
              velocity,
              ...(channel !== undefined ? { channel } : {}),
            })
          }
        }
        if (chord.bass !== undefined) {
          const bassNote = (octave + 1) * 12 + chord.bass - 12
          if (bassNote >= 0 && bassNote <= 127) {
            newNotes.push({
              tick: cursor,
              duration: durationTicks,
              noteNumber: bassNote,
              velocity,
              ...(channel !== undefined ? { channel } : {}),
            })
          }
        }
      } else {
        // Parse as note spec (C4, 60, Eb5, etc.)
        const noteNumber = parseNoteSpec(arg)
        newNotes.push({
          tick: cursor,
          duration: durationTicks,
          noteNumber,
          velocity,
          ...(channel !== undefined ? { channel } : {}),
        })
      }
      if (eachTicks) cursor += eachTicks
    }
  }

  // Merge new notes with existing
  const allNotes = [...stream.notes, ...newNotes]
  allNotes.sort((a, b) => a.tick - b.tick || a.noteNumber - b.noteNumber)

  writeNoteStream({ context, notes: allNotes })
}
