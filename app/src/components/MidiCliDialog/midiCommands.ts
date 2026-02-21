import type { NoteEvent, Track } from "@signal-app/core"
import { isNoteEvent, isTimeSignatureEvent, Measure } from "@signal-app/core"

// ─── Types ───

interface SerializedNote {
  tick: number
  duration: number
  noteNumber: number
  velocity: number
  channel?: number
  id?: number
}

interface SerializedMeasure {
  tick: number
  measure: number
  numerator: number
  denominator: number
}

interface NoteStreamContext {
  timebase: number
  measures: SerializedMeasure[]
  selection?: {
    fromTick: number
    toTick: number
  }
}

interface NoteStream {
  context: NoteStreamContext
  notes: SerializedNote[]
}

// ─── Extract NoteStream from app state ───

export function buildNoteStream(
  track: Track,
  conductorTrack: Track | undefined,
  timebase: number,
  noteIds?: number[],
): NoteStream {
  const timeSignatureEvents = conductorTrack
    ? conductorTrack.events.filter(isTimeSignatureEvent)
    : []

  const measures = Measure.fromTimeSignatures(
    timeSignatureEvents.map((e) => ({
      tick: e.tick,
      numerator: e.numerator,
      denominator: e.denominator,
    })),
    timebase,
  )

  const context: NoteStreamContext = {
    timebase,
    measures: measures.map((m) => ({
      tick: m.tick,
      measure: m.measure,
      numerator: m.numerator,
      denominator: m.denominator,
    })),
  }

  const noteIdSet = noteIds !== undefined ? new Set(noteIds) : undefined
  const noteEvents = track.events.filter(isNoteEvent)
  const filteredEvents =
    noteIdSet !== undefined
      ? noteEvents.filter((e: NoteEvent) => noteIdSet.has(e.id))
      : noteEvents

  const notes: SerializedNote[] = filteredEvents.map((e: NoteEvent) => ({
    tick: e.tick,
    duration: e.duration,
    noteNumber: e.noteNumber,
    velocity: e.velocity,
    channel: track.channel,
    id: e.id,
  }))

  return { context, notes }
}

// ─── Command Parser ───

interface ParsedCommand {
  name: string
  args: string[]
  options: Record<string, string | boolean>
}

function parseCommandString(input: string): ParsedCommand {
  const tokens: string[] = []
  let current = ""
  let inQuote = false
  let quoteChar = ""

  for (const ch of input) {
    if (inQuote) {
      if (ch === quoteChar) {
        inQuote = false
      } else {
        current += ch
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = true
      quoteChar = ch
    } else if (ch === " " || ch === "\t") {
      if (current) {
        tokens.push(current)
        current = ""
      }
    } else {
      current += ch
    }
  }
  if (current) tokens.push(current)

  if (tokens.length === 0) {
    return { name: "", args: [], options: {} }
  }

  const name = tokens[0]
  const args: string[] = []
  const options: Record<string, string | boolean> = {}

  let i = 1
  while (i < tokens.length) {
    const token = tokens[i]
    if (token.startsWith("--")) {
      const key = token.slice(2)
      if (i + 1 < tokens.length && !tokens[i + 1].startsWith("-")) {
        options[key] = tokens[i + 1]
        i += 2
      } else {
        options[key] = true
        i++
      }
    } else if (token.startsWith("-") && token.length === 2) {
      const key = token.slice(1)
      if (i + 1 < tokens.length && !tokens[i + 1].startsWith("-")) {
        options[key] = tokens[i + 1]
        i += 2
      } else {
        options[key] = true
        i++
      }
    } else {
      args.push(token)
      i++
    }
  }

  return { name, args, options }
}

// ─── Parse Utilities ───

const NOTE_MAP: Record<string, number> = {
  c: 0,
  "c#": 1,
  db: 1,
  d: 2,
  "d#": 3,
  eb: 3,
  e: 4,
  fb: 4,
  "e#": 5,
  f: 5,
  "f#": 6,
  gb: 6,
  g: 7,
  "g#": 8,
  ab: 8,
  a: 9,
  "a#": 10,
  bb: 10,
  b: 11,
  cb: 11,
}

const SCALE_INTERVALS: Record<string, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonicminor: [0, 2, 3, 5, 7, 8, 11],
  harmonicmajor: [0, 2, 4, 5, 7, 8, 11],
  melodicminor: [0, 2, 3, 5, 7, 9, 11],
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  majorpentatonic: [0, 2, 4, 7, 9],
  minorpentatonic: [0, 3, 5, 7, 10],
  majorblues: [0, 2, 3, 4, 7, 9],
  minorblues: [0, 3, 5, 6, 7, 10],
  halfwholediminished: [0, 1, 3, 4, 6, 7, 9, 10],
  wholehalddiminished: [0, 2, 3, 5, 6, 8, 9, 11],
  wholetone: [0, 2, 4, 6, 8, 10],
}

function parseScale(input: string): number[] {
  const s = input.trim().toLowerCase()
  const hyphenIndex = s.indexOf("-")

  if (hyphenIndex === -1) {
    const intervals = SCALE_INTERVALS[s.replace(/-/g, "")]
    if (intervals) return [...intervals]
    throw new Error(`Unknown scale: "${input}"`)
  }

  const keyStr = s.slice(0, hyphenIndex)
  const scaleStr = s.slice(hyphenIndex + 1).replace(/-/g, "")
  const key = NOTE_MAP[keyStr]
  if (key === undefined) throw new Error(`Invalid key: "${keyStr}"`)

  const intervals = SCALE_INTERVALS[scaleStr]
  if (!intervals) throw new Error(`Unknown scale type: "${scaleStr}"`)

  return intervals.map((i) => (i + key) % 12)
}

function parseGrid(input: string, timebase: number): number {
  const s = input.trim().toLowerCase()

  if (/^\d+$/.test(s)) return parseInt(s, 10)

  const tripletMatch = s.match(/^(\d+)\/(\d+)t$/)
  if (tripletMatch) {
    const num = parseInt(tripletMatch[1], 10)
    const den = parseInt(tripletMatch[2], 10)
    return Math.round((((timebase * 4 * num) / den) * 2) / 3)
  }

  const dottedMatch = s.match(/^(\d+)\/(\d+)\.$/)
  if (dottedMatch) {
    const num = parseInt(dottedMatch[1], 10)
    const den = parseInt(dottedMatch[2], 10)
    return Math.round(((timebase * 4 * num) / den) * 1.5)
  }

  const fractionMatch = s.match(/^(\d+)\/(\d+)$/)
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10)
    const den = parseInt(fractionMatch[2], 10)
    return Math.round((timebase * 4 * num) / den)
  }

  throw new Error(`Invalid grid value: "${input}"`)
}

function parseNoteSpec(s: string): number {
  const trimmed = s.trim()
  if (/^\d+$/.test(trimmed)) {
    const n = parseInt(trimmed, 10)
    if (n < 0 || n > 127) throw new Error(`MIDI note out of range: ${n}`)
    return n
  }
  const match = trimmed.toLowerCase().match(/^([a-g][#b]?)(-?\d+)$/)
  if (match) {
    const pitchClass = NOTE_MAP[match[1]]
    if (pitchClass === undefined)
      throw new Error(`Invalid note name: "${match[1]}"`)
    const octave = parseInt(match[2], 10)
    const midiNote = (octave + 1) * 12 + pitchClass
    if (midiNote < 0 || midiNote > 127)
      throw new Error(`Note "${trimmed}" out of MIDI range`)
    return midiNote
  }
  throw new Error(`Invalid note: "${trimmed}"`)
}

function parseNoteRange(input: string): { min: number; max: number } {
  const s = input.trim()
  for (let i = 1; i < s.length; i++) {
    if (s[i] === "-" && /\d/.test(s[i - 1])) {
      const min = parseNoteSpec(s.slice(0, i))
      const max = parseNoteSpec(s.slice(i + 1))
      return { min: Math.min(min, max), max: Math.max(min, max) }
    }
  }
  const note = parseNoteSpec(s)
  return { min: note, max: note }
}

function parseVelocityRange(input: string): { min: number; max: number } {
  const parts = input.trim().split("-")
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10)
    const max = parseInt(parts[1], 10)
    if (Number.isNaN(min) || Number.isNaN(max))
      throw new Error(`Invalid velocity range: "${input}"`)
    return { min: Math.max(0, min), max: Math.min(127, max) }
  }
  const val = parseInt(input.trim(), 10)
  if (Number.isNaN(val)) throw new Error(`Invalid velocity: "${input}"`)
  return { min: val, max: val }
}

function parsePosition(
  input: string,
  timebase: number,
  measures: SerializedMeasure[],
): number {
  const s = input.trim().toLowerCase()
  if (s === "start") return 0
  if (s === "end") return Number.MAX_SAFE_INTEGER

  const tickMatch = s.match(/^t(\d+)$/)
  if (tickMatch) return parseInt(tickMatch[1], 10)

  const mbtMatch = s.match(/^m(\d+)(?:-(\d+))?(?:-(\d+))?$/)
  if (mbtMatch) {
    const measureNum = parseInt(mbtMatch[1], 10)
    const beatNum = mbtMatch[2] ? parseInt(mbtMatch[2], 10) : 1
    const subTick = mbtMatch[3] ? parseInt(mbtMatch[3], 10) : 0

    const targetMeasure = measureNum - 1
    const targetBeat = beatNum - 1

    const defaultM = { tick: 0, measure: 0, numerator: 4, denominator: 4 }
    let measureDef = measures.length > 0 ? measures[0] : defaultM
    for (const m of measures) {
      if (m.measure <= targetMeasure) measureDef = m
      else break
    }

    const ticksPerBeat = (timebase * 4) / measureDef.denominator
    const ticksPerMeasure = ticksPerBeat * measureDef.numerator
    const deltaMeasures = targetMeasure - measureDef.measure
    return (
      measureDef.tick +
      deltaMeasures * ticksPerMeasure +
      targetBeat * ticksPerBeat +
      subTick
    )
  }

  throw new Error(`Invalid position: "${input}"`)
}

function parseShiftAmount(
  amount: string,
  timebase: number,
  measures: SerializedMeasure[],
): number {
  const s = amount.trim()

  const tickMatch = s.match(/^([+-]?\d+)t$/)
  if (tickMatch) return parseInt(tickMatch[1], 10)

  const beatMatch = s.match(/^([+-]?\d+)b$/)
  if (beatMatch) {
    const beats = parseInt(beatMatch[1], 10)
    const denom = measures.length > 0 ? measures[0].denominator : 4
    return Math.round((beats * (timebase * 4)) / denom)
  }

  const measureMatch = s.match(/^([+-]?\d+)m$/)
  if (measureMatch) {
    const numMeasures = parseInt(measureMatch[1], 10)
    const m =
      measures.length > 0 ? measures[0] : { numerator: 4, denominator: 4 }
    const ticksPerBeat = (timebase * 4) / m.denominator
    return Math.round(numMeasures * ticksPerBeat * m.numerator)
  }

  const plain = parseInt(s, 10)
  if (!Number.isNaN(plain)) return plain

  throw new Error(
    `Invalid shift amount: "${amount}". Use <n>t, <n>b, <n>m, or a number`,
  )
}

// ─── Transform Functions ───

function transposeNotes(
  notes: SerializedNote[],
  semitones: number,
): SerializedNote[] {
  return notes.map((n) => ({
    ...n,
    noteNumber: Math.max(0, Math.min(127, n.noteNumber + semitones)),
  }))
}

function quantizeNotes(
  notes: SerializedNote[],
  intervals: number[],
  direction: "nearest" | "up" | "down",
): SerializedNote[] {
  return notes.map((note) => {
    const pitchClass = note.noteNumber % 12
    if (intervals.includes(pitchClass)) return note

    let bestOffset = 0
    let bestDistance = 13

    for (const interval of intervals) {
      const upDist = (interval - pitchClass + 12) % 12
      const downDist = (pitchClass - interval + 12) % 12

      if (direction === "up") {
        if (upDist < bestDistance) {
          bestDistance = upDist
          bestOffset = upDist
        }
      } else if (direction === "down") {
        if (downDist < bestDistance) {
          bestDistance = downDist
          bestOffset = -downDist
        }
      } else {
        if (upDist <= downDist && upDist < bestDistance) {
          bestDistance = upDist
          bestOffset = upDist
        } else if (downDist < upDist && downDist < bestDistance) {
          bestDistance = downDist
          bestOffset = -downDist
        }
      }
    }

    return {
      ...note,
      noteNumber: Math.max(0, Math.min(127, note.noteNumber + bestOffset)),
    }
  })
}

function quantizeTimeNotes(
  notes: SerializedNote[],
  gridTicks: number,
  strength: number,
): SerializedNote[] {
  const factor = strength / 100
  return notes.map((note) => {
    const quantized = Math.round(note.tick / gridTicks) * gridTicks
    const newTick = Math.round(note.tick + (quantized - note.tick) * factor)
    return { ...note, tick: Math.max(0, newTick) }
  })
}

function velocityTransform(
  notes: SerializedNote[],
  operation: string,
  values: string[],
): SerializedNote[] {
  const clamp = (v: number) => Math.max(1, Math.min(127, Math.round(v)))

  switch (operation) {
    case "set": {
      const val = parseInt(values[0], 10)
      if (Number.isNaN(val)) throw new Error(`Invalid velocity: "${values[0]}"`)
      return notes.map((n) => ({ ...n, velocity: clamp(val) }))
    }
    case "add": {
      const delta = parseInt(values[0], 10)
      if (Number.isNaN(delta)) throw new Error(`Invalid delta: "${values[0]}"`)
      return notes.map((n) => ({ ...n, velocity: clamp(n.velocity + delta) }))
    }
    case "scale": {
      const factor = parseFloat(values[0])
      if (Number.isNaN(factor))
        throw new Error(`Invalid factor: "${values[0]}"`)
      return notes.map((n) => ({ ...n, velocity: clamp(n.velocity * factor) }))
    }
    case "ramp": {
      const start = parseInt(values[0], 10)
      const end = parseInt(values[1], 10)
      if (Number.isNaN(start) || Number.isNaN(end))
        throw new Error("Invalid ramp values")
      if (notes.length <= 1)
        return notes.map((n) => ({ ...n, velocity: clamp(start) }))
      return notes.map((n, i) => {
        const t = i / (notes.length - 1)
        return { ...n, velocity: clamp(start + (end - start) * t) }
      })
    }
    case "random": {
      const min = parseInt(values[0], 10)
      const max = parseInt(values[1], 10)
      if (Number.isNaN(min) || Number.isNaN(max))
        throw new Error("Invalid random range")
      return notes.map((n) => ({
        ...n,
        velocity: clamp(min + Math.random() * (max - min)),
      }))
    }
    default:
      throw new Error(
        `Unknown velocity operation: "${operation}". Use: set, add, scale, ramp, random`,
      )
  }
}

function shiftNotes(notes: SerializedNote[], delta: number): SerializedNote[] {
  return notes.map((n) => ({ ...n, tick: Math.max(0, n.tick + delta) }))
}

function filterNotes(
  notes: SerializedNote[],
  predicates: ((n: SerializedNote) => boolean)[],
  invert: boolean,
): SerializedNote[] {
  const match = (n: SerializedNote) => predicates.every((p) => p(n))
  return invert ? notes.filter((n) => !match(n)) : notes.filter(match)
}

function durationTransform(
  notes: SerializedNote[],
  operation: string,
  value: string | undefined,
  timebase: number,
): SerializedNote[] {
  switch (operation) {
    case "set": {
      if (!value)
        throw new Error("duration set requires a value (e.g., 1/8 or 240)")
      const ticks = parseGrid(value, timebase)
      return notes.map((n) => ({ ...n, duration: ticks }))
    }
    case "scale": {
      if (!value) throw new Error("duration scale requires a factor")
      const factor = parseFloat(value)
      if (Number.isNaN(factor)) throw new Error(`Invalid factor: "${value}"`)
      return notes.map((n) => ({
        ...n,
        duration: Math.max(1, Math.round(n.duration * factor)),
      }))
    }
    case "legato": {
      const sorted = [...notes].sort((a, b) => a.tick - b.tick)
      return sorted.map((n, i) => {
        if (i < sorted.length - 1) {
          return { ...n, duration: Math.max(1, sorted[i + 1].tick - n.tick) }
        }
        return n
      })
    }
    case "staccato": {
      const pct = value ? parseFloat(value) : 50
      if (Number.isNaN(pct))
        throw new Error(`Invalid staccato percentage: "${value}"`)
      const factor = pct / 100
      return notes.map((n) => ({
        ...n,
        duration: Math.max(1, Math.round(n.duration * factor)),
      }))
    }
    default:
      throw new Error(
        `Unknown duration operation: "${operation}". Use: set, scale, legato, staccato`,
      )
  }
}

function humanizeNotes(
  notes: SerializedNote[],
  maxTimeDelta: number,
  maxVelDelta: number,
): SerializedNote[] {
  return notes.map((note) => {
    let { tick, velocity } = note
    if (maxTimeDelta > 0)
      tick = Math.max(
        0,
        tick + Math.round((Math.random() * 2 - 1) * maxTimeDelta),
      )
    if (maxVelDelta > 0)
      velocity = Math.max(
        1,
        Math.min(
          127,
          velocity + Math.round((Math.random() * 2 - 1) * maxVelDelta),
        ),
      )
    return { ...note, tick, velocity }
  })
}

function invertNotes(notes: SerializedNote[], axis?: number): SerializedNote[] {
  if (notes.length === 0) return notes
  const a =
    axis ??
    Math.round(
      (Math.min(...notes.map((n) => n.noteNumber)) +
        Math.max(...notes.map((n) => n.noteNumber))) /
        2,
    )
  return notes.map((n) => ({
    ...n,
    noteNumber: Math.max(0, Math.min(127, 2 * a - n.noteNumber)),
  }))
}

function retrogradeNotes(notes: SerializedNote[]): SerializedNote[] {
  if (notes.length <= 1) return notes
  const sorted = [...notes].sort((a, b) => a.tick - b.tick)
  const firstTick = sorted[0].tick
  const lastTick = sorted[sorted.length - 1].tick
  const result = notes.map((n) => ({
    ...n,
    tick: firstTick + (lastTick - n.tick),
  }))
  result.sort((a, b) => a.tick - b.tick)
  return result
}

// ─── Command Executor ───

export interface CommandResult {
  stream: NoteStream
  message: string
}

function executeOneCommand(
  cmd: ParsedCommand,
  stream: NoteStream,
): CommandResult {
  const { context } = stream
  let { notes } = stream

  switch (cmd.name) {
    case "transpose": {
      const semitones = parseInt(cmd.args[0], 10)
      if (Number.isNaN(semitones))
        throw new Error("transpose requires a semitone value")
      notes = transposeNotes(notes, semitones)
      return {
        stream: { context, notes },
        message: `Transposed ${notes.length} notes by ${semitones} semitones`,
      }
    }

    case "quantize": {
      const scaleStr = (cmd.options.s ?? cmd.options.scale) as string
      if (!scaleStr) throw new Error("quantize requires --scale (-s)")
      const intervals = parseScale(scaleStr)
      const dir = (((cmd.options.d ?? cmd.options.direction) as string) ??
        "nearest") as "nearest" | "up" | "down"
      notes = quantizeNotes(notes, intervals, dir)
      return {
        stream: { context, notes },
        message: `Quantized ${notes.length} notes to ${scaleStr}`,
      }
    }

    case "quantize-time": {
      const gridStr = (cmd.options.g ?? cmd.options.grid) as string
      if (!gridStr) throw new Error("quantize-time requires --grid (-g)")
      const gridTicks = parseGrid(gridStr, context.timebase)
      const strength = cmd.options.strength
        ? parseInt(cmd.options.strength as string, 10)
        : 100
      notes = quantizeTimeNotes(notes, gridTicks, strength)
      return {
        stream: { context, notes },
        message: `Quantized timing of ${notes.length} notes to ${gridStr}`,
      }
    }

    case "velocity": {
      const operation = cmd.args[0]
      if (!operation)
        throw new Error(
          "velocity requires an operation: set, add, scale, ramp, random",
        )
      notes = velocityTransform(notes, operation, cmd.args.slice(1))
      return {
        stream: { context, notes },
        message: `Applied velocity ${operation} to ${notes.length} notes`,
      }
    }

    case "shift": {
      const amount = cmd.args[0]
      if (!amount)
        throw new Error("shift requires an amount (e.g., +120t, -1b, +2m)")
      const delta = parseShiftAmount(amount, context.timebase, context.measures)
      notes = shiftNotes(notes, delta)
      return {
        stream: { context, notes },
        message: `Shifted ${notes.length} notes by ${amount}`,
      }
    }

    case "filter": {
      const predicates: ((n: SerializedNote) => boolean)[] = []
      let filterFromTick: number | undefined
      let filterToTick: number | undefined
      if (cmd.options.from) {
        filterFromTick = parsePosition(
          cmd.options.from as string,
          context.timebase,
          context.measures,
        )
        const ft = filterFromTick
        predicates.push((n) => n.tick >= ft)
      }
      if (cmd.options.to) {
        filterToTick = parsePosition(
          cmd.options.to as string,
          context.timebase,
          context.measures,
        )
        const tt = filterToTick
        predicates.push((n) => n.tick < tt)
      }
      if (cmd.options.pitch) {
        const { min, max } = parseNoteRange(cmd.options.pitch as string)
        predicates.push((n) => n.noteNumber >= min && n.noteNumber <= max)
      }
      if (cmd.options.velocity) {
        const { min, max } = parseVelocityRange(cmd.options.velocity as string)
        predicates.push((n) => n.velocity >= min && n.velocity <= max)
      }
      const invert = cmd.options.invert === true
      notes = filterNotes(notes, predicates, invert)
      const filterSelection =
        filterFromTick !== undefined || filterToTick !== undefined
          ? {
              fromTick: filterFromTick ?? 0,
              toTick: filterToTick ?? Number.POSITIVE_INFINITY,
            }
          : context.selection
      return {
        stream: { context: { ...context, selection: filterSelection }, notes },
        message: `Filtered to ${notes.length} notes`,
      }
    }

    case "get-notes": {
      const predicates: ((n: SerializedNote) => boolean)[] = []
      let getFromTick: number | undefined
      let getToTick: number | undefined
      if (cmd.options.from) {
        getFromTick = parsePosition(
          cmd.options.from as string,
          context.timebase,
          context.measures,
        )
        const ft = getFromTick
        predicates.push((n) => n.tick >= ft)
      }
      if (cmd.options.to) {
        getToTick = parsePosition(
          cmd.options.to as string,
          context.timebase,
          context.measures,
        )
        const tt = getToTick
        predicates.push((n) => n.tick < tt)
      }
      if (cmd.options.pitch) {
        const { min, max } = parseNoteRange(cmd.options.pitch as string)
        predicates.push((n) => n.noteNumber >= min && n.noteNumber <= max)
      }
      if (cmd.options.velocity) {
        const { min, max } = parseVelocityRange(cmd.options.velocity as string)
        predicates.push((n) => n.velocity >= min && n.velocity <= max)
      }
      notes = filterNotes(notes, predicates, false)
      const getSelection =
        getFromTick !== undefined || getToTick !== undefined
          ? {
              fromTick: getFromTick ?? 0,
              toTick: getToTick ?? Number.POSITIVE_INFINITY,
            }
          : context.selection
      return {
        stream: { context: { ...context, selection: getSelection }, notes },
        message: `Selected ${notes.length} notes`,
      }
    }

    case "duration": {
      const operation = cmd.args[0]
      if (!operation)
        throw new Error(
          "duration requires an operation: set, scale, legato, staccato",
        )
      notes = durationTransform(notes, operation, cmd.args[1], context.timebase)
      return {
        stream: { context, notes },
        message: `Applied duration ${operation} to ${notes.length} notes`,
      }
    }

    case "humanize": {
      const maxTime = cmd.options.time
        ? parseInt(cmd.options.time as string, 10)
        : 0
      const maxVel = cmd.options.velocity
        ? parseInt(cmd.options.velocity as string, 10)
        : 0
      if (maxTime === 0 && maxVel === 0)
        throw new Error("humanize requires --time and/or --velocity")
      notes = humanizeNotes(notes, maxTime, maxVel)
      return {
        stream: { context, notes },
        message: `Humanized ${notes.length} notes`,
      }
    }

    case "invert": {
      const axis = cmd.options.axis
        ? parseInt(cmd.options.axis as string, 10)
        : undefined
      notes = invertNotes(notes, axis)
      return {
        stream: { context, notes },
        message: `Inverted ${notes.length} notes`,
      }
    }

    case "retrograde": {
      notes = retrogradeNotes(notes)
      return {
        stream: { context, notes },
        message: `Reversed ${notes.length} notes`,
      }
    }

    case "help": {
      const helpText = [
        "Available commands:",
        "  transpose <semitones>           Shift pitches by semitones",
        "  quantize -s <key-scale>         Quantize to scale (e.g., d-major)",
        "  quantize-time -g <grid>         Quantize timing (e.g., 1/8, 1/16)",
        "  velocity <op> [values]          Adjust velocity (set/add/scale/ramp/random)",
        "  shift <amount>                  Move in time (+120t, -1b, +2m)",
        "  filter [--pitch] [--velocity]   Filter notes by criteria",
        "  get-notes [--from] [--to]       Select notes by position/pitch",
        "  duration <op> [value]           Adjust durations (set/scale/legato/staccato)",
        "  humanize [--time] [--velocity]  Add random variation",
        "  invert [--axis <note>]          Mirror pitches",
        "  retrograde                      Reverse note order",
        "",
        "Pipe commands: transpose 2 | velocity scale 0.8",
      ].join("\n")
      return { stream, message: helpText }
    }

    default:
      throw new Error(
        `Unknown command: "${cmd.name}". Type "help" for available commands.`,
      )
  }
}

/**
 * Execute a command string (possibly piped) against a NoteStream.
 * Returns the final NoteStream and a combined message.
 */
export function executeCommand(
  input: string,
  stream: NoteStream,
): CommandResult {
  const pipeline = input
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)

  if (pipeline.length === 0) {
    return { stream, message: "" }
  }

  let currentStream = stream
  const messages: string[] = []

  for (const segment of pipeline) {
    const cmd = parseCommandString(segment)
    if (!cmd.name) continue
    const result = executeOneCommand(cmd, currentStream)
    currentStream = result.stream
    messages.push(result.message)
  }

  return { stream: currentStream, message: messages.join("\n") }
}
