import { hasStdinInput, readNoteStream, writeNoteStream } from "../io.js"
import { parseChord } from "../parse/chord.js"
import { parseGrid } from "../parse/grid.js"
import { parseNoteSpec } from "../parse/noteRange.js"
import { parsePosition } from "../parse/position.js"
import type { NoteStream, SerializedNote } from "../types.js"

export interface GenPatternOptions {
  arpeggio?: string
  notes?: string[]
  pattern?: string
  duration?: string
  octaves?: string
  at?: string
  repeat?: string
  velocity?: string
  rhythm?: string
  channel?: string
}

type PatternDirection = "up" | "down" | "updown" | "downup" | "random"

export async function genPatternCommand(
  options: GenPatternOptions,
): Promise<void> {
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
  const repeatCount = options.repeat ? parseInt(options.repeat, 10) : 1
  const numOctaves = options.octaves ? parseInt(options.octaves, 10) : 1
  const durationStr = options.duration ?? "1/8"
  const durationTicks = parseGrid(durationStr, timebase)
  const direction: PatternDirection =
    (options.pattern as PatternDirection) ?? "up"
  const channel = options.channel ? parseInt(options.channel, 10) : undefined

  let cursor = 0
  if (options.at) {
    cursor = parsePosition(options.at, timebase, context.measures)
  }

  // Build the note list
  let pitches: number[] = []

  if (options.arpeggio) {
    const chord = parseChord(options.arpeggio)
    const basePitch = 60 + chord.root // default octave 4
    for (let oct = 0; oct < numOctaves; oct++) {
      for (const interval of chord.intervals) {
        pitches.push(basePitch + interval + oct * 12)
      }
    }
  } else if (options.notes) {
    pitches = options.notes.map((n) => parseNoteSpec(n))
    // Extend across octaves
    if (numOctaves > 1) {
      const base = [...pitches]
      for (let oct = 1; oct < numOctaves; oct++) {
        pitches.push(...base.map((p) => p + oct * 12))
      }
    }
  } else {
    throw new Error("gen-pattern requires either --arpeggio or --notes")
  }

  // Filter out out-of-range notes
  pitches = pitches.filter((p) => p >= 0 && p <= 127)

  // Apply pattern direction
  const ordered = applyPattern(pitches, direction)

  // Parse rhythm if provided (space-separated durations)
  let rhythmTicks: number[] | undefined
  if (options.rhythm) {
    rhythmTicks = options.rhythm.split(/\s+/).map((r) => parseGrid(r, timebase))
  }

  // Generate notes for each repetition
  const newNotes: SerializedNote[] = []

  for (let rep = 0; rep < repeatCount; rep++) {
    for (let i = 0; i < ordered.length; i++) {
      const dur = rhythmTicks
        ? rhythmTicks[i % rhythmTicks.length]
        : durationTicks
      newNotes.push({
        tick: cursor,
        duration: dur,
        noteNumber: ordered[i],
        velocity,
        ...(channel !== undefined ? { channel } : {}),
      })
      cursor += dur
    }
  }

  const allNotes = [...stream.notes, ...newNotes]
  allNotes.sort((a, b) => a.tick - b.tick || a.noteNumber - b.noteNumber)

  writeNoteStream({ context, notes: allNotes })
}

function applyPattern(
  pitches: number[],
  direction: PatternDirection,
): number[] {
  const sorted = [...pitches].sort((a, b) => a - b)

  switch (direction) {
    case "up":
      return sorted
    case "down":
      return [...sorted].reverse()
    case "updown": {
      const up = [...sorted]
      const down = [...sorted].reverse().slice(1, -1) // skip first & last to avoid repeats
      return [...up, ...down]
    }
    case "downup": {
      const down = [...sorted].reverse()
      const up = [...sorted].slice(1, -1)
      return [...down, ...up]
    }
    case "random": {
      const shuffled = [...sorted]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }
  }
}
