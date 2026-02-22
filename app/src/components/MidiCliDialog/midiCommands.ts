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
  vars?: Record<string, string>
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

// ─── Chord Intervals ───

const CHORD_INTERVALS: Record<string, readonly number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  maj7: [0, 4, 7, 11],
  "7": [0, 4, 7, 10],
  min7: [0, 3, 7, 10],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
  minmaj7: [0, 3, 7, 11],
  aug7: [0, 4, 8, 10],
  "9": [0, 4, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  min9: [0, 3, 7, 10, 14],
  "11": [0, 4, 7, 10, 14, 17],
  "13": [0, 4, 7, 10, 14, 17, 21],
  add9: [0, 4, 7, 14],
  add11: [0, 4, 7, 17],
  "6": [0, 4, 7, 9],
  min6: [0, 3, 7, 9],
  "5": [0, 7],
}

const CHORD_SUFFIX_MAP: [string, string][] = [
  ["minmaj7", "minmaj7"],
  ["mmaj7", "minmaj7"],
  ["min9", "min9"],
  ["m9", "min9"],
  ["min7", "min7"],
  ["m7b5", "m7b5"],
  ["m7", "min7"],
  ["min6", "min6"],
  ["m6", "min6"],
  ["min", "min"],
  ["m", "min"],
  ["maj9", "maj9"],
  ["maj7", "maj7"],
  ["maj", "maj"],
  ["aug7", "aug7"],
  ["aug", "aug"],
  ["dim7", "dim7"],
  ["dim", "dim"],
  ["sus2", "sus2"],
  ["sus4", "sus4"],
  ["add9", "add9"],
  ["add11", "add11"],
  ["13", "13"],
  ["11", "11"],
  ["9", "9"],
  ["7", "7"],
  ["6", "6"],
  ["5", "5"],
]

function parseChordSymbol(input: string): {
  root: number
  type: string
  intervals: number[]
  bass?: number
} {
  const s = input.trim()
  const slashIndex = s.indexOf("/")
  let mainPart = s
  let bass: number | undefined

  if (slashIndex > 0) {
    mainPart = s.slice(0, slashIndex)
    const bassStr = s.slice(slashIndex + 1).toLowerCase()
    bass = NOTE_MAP[bassStr]
    if (bass === undefined)
      throw new Error(`Invalid bass note in slash chord: "${s}"`)
  }

  const lower = mainPart.toLowerCase()
  let root: number | undefined
  let restStart = 1

  if (mainPart.length >= 2) {
    const twoChar = lower.slice(0, 2)
    if (NOTE_MAP[twoChar] !== undefined) {
      root = NOTE_MAP[twoChar]
      restStart = 2
    }
  }
  if (root === undefined) {
    const oneChar = lower.slice(0, 1)
    if (NOTE_MAP[oneChar] !== undefined) {
      root = NOTE_MAP[oneChar]
      restStart = 1
    }
  }
  if (root === undefined) throw new Error(`Invalid chord root: "${mainPart}"`)

  const suffix = mainPart.slice(restStart).toLowerCase()
  let chordType = "maj"

  if (suffix.length > 0) {
    let found = false
    for (const [pattern, type] of CHORD_SUFFIX_MAP) {
      if (suffix === pattern) {
        chordType = type
        found = true
        break
      }
    }
    if (!found) throw new Error(`Unknown chord type: "${suffix}"`)
  }

  const intervals = [...(CHORD_INTERVALS[chordType] ?? [0, 4, 7])]
  return { root, type: chordType, intervals, bass }
}

function isChordSymbol(input: string): boolean {
  const s = input.trim()
  try {
    parseChordSymbol(s)
    if (/^[A-Ga-g][#b]?\d$/.test(s)) return false
    return true
  } catch {
    return false
  }
}

// ─── Degree Parsing ───

const MAJOR_DEGREE_QUALITIES = ["maj", "min", "min", "maj", "maj", "min", "dim"]
const MINOR_DEGREE_QUALITIES = ["min", "dim", "maj", "min", "min", "maj", "maj"]
const NOTE_NAMES_DISPLAY = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
]
const DEGREE_NAMES = ["I", "II", "III", "IV", "V", "VI", "VII"]

function romanToNumber(roman: string): number {
  const map: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
  }
  return map[roman.toUpperCase()] ?? 0
}

function parseScaleFull(input: string): {
  key: number
  scaleName: string
  intervals: number[]
} {
  const s = input.trim().toLowerCase()
  const hyphenIndex = s.indexOf("-")
  if (hyphenIndex === -1)
    throw new Error(`Expected key-scale format: "${input}"`)
  const keyStr = s.slice(0, hyphenIndex)
  const scaleStr = s.slice(hyphenIndex + 1).replace(/-/g, "")
  const key = NOTE_MAP[keyStr]
  if (key === undefined) throw new Error(`Invalid key: "${keyStr}"`)
  const intervals = SCALE_INTERVALS[scaleStr]
  if (!intervals) throw new Error(`Unknown scale: "${scaleStr}"`)
  return { key, scaleName: scaleStr, intervals: [...intervals] }
}

function parseDegreeNumeral(
  numeral: string,
  key: number,
  scaleIntervals: number[],
  scaleName: string,
): { root: number; chordType: string } {
  let rest = numeral.trim()
  let accidental = 0

  if (rest.startsWith("b") || rest.startsWith("♭")) {
    accidental = -1
    rest = rest.slice(1)
  } else if (rest.startsWith("#") || rest.startsWith("♯")) {
    accidental = 1
    rest = rest.slice(1)
  }

  const romanMatch = rest.match(/^(VII|vii|IV|iv|VI|vi|III|iii|II|ii|V|v|I|i)/)
  if (!romanMatch) throw new Error(`Invalid degree: "${numeral}"`)

  const romanStr = romanMatch[0]
  rest = rest.slice(romanStr.length)

  let hasDimSymbol = false
  if (rest.startsWith("°") || rest.startsWith("o")) {
    hasDimSymbol = true
    rest = rest.slice(1)
  }

  const degree = romanToNumber(romanStr)
  const isUpperCase = romanStr[0] === romanStr[0].toUpperCase()
  const degreeIndex = degree - 1
  if (degreeIndex < 0 || degreeIndex >= scaleIntervals.length)
    throw new Error(`Degree ${degree} out of range`)

  const root = (key + scaleIntervals[degreeIndex] + accidental + 12) % 12

  let chordType: string
  if (rest) {
    // Explicit suffix
    const suffixMap: Record<string, string> = {
      maj7: "maj7",
      "7": "7",
      min7: "min7",
      m7: "min7",
      dim7: "dim7",
      m7b5: "m7b5",
      aug: "aug",
      aug7: "aug7",
      sus2: "sus2",
      sus4: "sus4",
      "9": "9",
      maj9: "maj9",
      min9: "min9",
      "11": "11",
      "13": "13",
      "6": "6",
      min6: "min6",
      add9: "add9",
      add11: "add11",
      "5": "5",
    }
    chordType = suffixMap[rest.toLowerCase()] ?? "maj"
  } else if (hasDimSymbol) {
    chordType = "dim"
  } else if (accidental !== 0) {
    chordType = isUpperCase ? "maj" : "min"
  } else {
    const isMinor = [
      "minor",
      "aeolian",
      "harmonicminor",
      "melodicminor",
    ].includes(scaleName)
    const qualities = isMinor ? MINOR_DEGREE_QUALITIES : MAJOR_DEGREE_QUALITIES
    chordType =
      degreeIndex < qualities.length
        ? qualities[degreeIndex]
        : isUpperCase
          ? "maj"
          : "min"
  }

  return { root, chordType }
}

// ─── Chord Detection ───

function detectBestChord(
  pitchClasses: number[],
): { root: number; type: string; inversion: number } | null {
  if (pitchClasses.length < 2) return null
  const unique = [...new Set(pitchClasses.map((p) => ((p % 12) + 12) % 12))]
  unique.sort((a, b) => a - b)

  let best: {
    root: number
    type: string
    inversion: number
    score: number
  } | null = null

  for (const [type, intervals] of Object.entries(CHORD_INTERVALS)) {
    for (let root = 0; root < 12; root++) {
      const chordPCs = intervals.map((i) => (root + i) % 12)
      const matchCount = unique.filter((p) => chordPCs.includes(p)).length
      const extraNotes = unique.filter((p) => !chordPCs.includes(p)).length
      const missingNotes = chordPCs.filter((p) => !unique.includes(p)).length

      if (matchCount < Math.min(chordPCs.length, unique.length)) continue
      if (extraNotes > 0) continue

      const bass = unique[0]
      let inversion = 0
      if (bass !== root) {
        const idx = chordPCs.indexOf(bass)
        if (idx > 0) inversion = idx
      }

      let score = 100 - missingNotes * 20 - inversion * 5
      if (unique.length <= 3 && chordPCs.length > 4) score -= 10
      if (chordPCs.length === unique.length) score += 10

      if (!best || score > best.score) {
        best = { root, type, inversion, score }
      }
    }
  }

  return best
    ? { root: best.root, type: best.type, inversion: best.inversion }
    : null
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
    return Math.max(
      0,
      measureDef.tick +
        deltaMeasures * ticksPerMeasure +
        targetBeat * ticksPerBeat +
        subTick,
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
      const filterFromOpt = cmd.options.from ?? cmd.options.start
      const filterToOpt = cmd.options.to ?? cmd.options.end
      if (filterFromOpt) {
        filterFromTick = parsePosition(
          filterFromOpt as string,
          context.timebase,
          context.measures,
        )
        const ft = filterFromTick
        predicates.push((n) => n.tick >= ft)
      }
      if (filterToOpt) {
        filterToTick = parsePosition(
          filterToOpt as string,
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
      if (cmd.options.channel) {
        const ch = parseInt(cmd.options.channel as string, 10)
        predicates.push((n) => n.channel === ch)
      }
      const invert = cmd.options.invert === true
      const matchFilter = (n: SerializedNote) => predicates.every((p) => p(n))
      let filteredNotes: SerializedNote[]
      if (cmd.options.nth) {
        const nth = parseInt(cmd.options.nth as string, 10)
        let count = 0
        filteredNotes = notes.filter((n) => {
          if (matchFilter(n)) {
            count++
            return invert ? count % nth !== 0 : count % nth === 0
          }
          return !!invert
        })
      } else if (cmd.options.random) {
        const pct = parseFloat(cmd.options.random as string)
        filteredNotes = notes.filter((n) => {
          if (matchFilter(n)) {
            const keep = Math.random() * 100 < pct
            return invert ? !keep : keep
          }
          return !!invert
        })
      } else {
        filteredNotes = filterNotes(notes, predicates, invert)
      }
      notes = filteredNotes
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
      const totalBefore = notes.length
      const fromOpt = cmd.options.from ?? cmd.options.start
      const toOpt = cmd.options.to ?? cmd.options.end
      if (fromOpt) {
        getFromTick = parsePosition(
          fromOpt as string,
          context.timebase,
          context.measures,
        )
        const ft = getFromTick
        predicates.push((n) => n.tick >= ft)
      }
      if (toOpt) {
        getToTick = parsePosition(
          toOpt as string,
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
      if (cmd.options.channel) {
        const ch = parseInt(cmd.options.channel as string, 10)
        predicates.push((n) => n.channel === ch)
      }
      notes = filterNotes(notes, predicates, false)
      if (cmd.options.nth) {
        const nth = parseInt(cmd.options.nth as string, 10)
        notes = notes.filter((_, i) => (i + 1) % nth === 0)
      }
      if (cmd.options.random) {
        const pct = parseFloat(cmd.options.random as string)
        notes = notes.filter(() => Math.random() * 100 < pct)
      }
      const getSelection =
        getFromTick !== undefined || getToTick !== undefined
          ? {
              fromTick: getFromTick ?? 0,
              toTick: getToTick ?? Number.POSITIVE_INFINITY,
            }
          : context.selection
      const rangeParts: string[] = []
      if (getFromTick !== undefined) rangeParts.push(`from=t${getFromTick}`)
      if (getToTick !== undefined) rangeParts.push(`to=t${getToTick}`)
      const rangeInfo =
        rangeParts.length > 0
          ? ` (${rangeParts.join(" ")} | timebase=${context.timebase} measures=${context.measures.length})`
          : ""
      return {
        stream: { context: { ...context, selection: getSelection }, notes },
        message: `Selected ${notes.length}/${totalBefore} notes${rangeInfo}`,
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

    case "add-notes": {
      const velocity = cmd.options.velocity
        ? parseInt(cmd.options.velocity as string, 10)
        : 100
      const octave = cmd.options.octave
        ? parseInt(cmd.options.octave as string, 10)
        : 4
      const durationStr = (cmd.options.duration as string) ?? "1/4"
      const durationTicks = parseGrid(durationStr, context.timebase)
      const eachTicks = cmd.options.each
        ? parseGrid(cmd.options.each as string, context.timebase)
        : undefined
      const strumTicks = cmd.options.strum
        ? parseInt(cmd.options.strum as string, 10)
        : 0
      let cursor = cmd.options.at
        ? parsePosition(
            cmd.options.at as string,
            context.timebase,
            context.measures,
          )
        : 0
      const channel = cmd.options.channel
        ? parseInt(cmd.options.channel as string, 10)
        : undefined
      const newNotes: SerializedNote[] = []

      if (cmd.options.rest === true) {
        if (eachTicks) cursor += eachTicks
        else cursor += durationTicks
      } else if (cmd.options.scale) {
        const scaleIntervals = parseScale(cmd.options.scale as string)
        for (const pc of scaleIntervals) {
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
      } else if (cmd.options.degree && cmd.options.key) {
        const keyInfo = parseScaleFull(cmd.options.key as string)
        const degrees = (cmd.options.degree as string).split(/[\s,]+/)
        for (const deg of degrees) {
          const info = parseDegreeNumeral(
            deg,
            keyInfo.key,
            keyInfo.intervals,
            keyInfo.scaleName,
          )
          const intervals = CHORD_INTERVALS[info.chordType] ?? [0, 4, 7]
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
        for (const arg of cmd.args) {
          if (isChordSymbol(arg)) {
            const chord = parseChordSymbol(arg)
            for (let i = 0; i < chord.intervals.length; i++) {
              const noteNumber =
                (octave + 1) * 12 + chord.root + chord.intervals[i]
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

      const allNotes = [...notes, ...newNotes]
      allNotes.sort((a, b) => a.tick - b.tick || a.noteNumber - b.noteNumber)
      return {
        stream: { context, notes: allNotes },
        message: `Added ${newNotes.length} notes`,
      }
    }

    case "gen-pattern": {
      const velocity = cmd.options.velocity
        ? parseInt(cmd.options.velocity as string, 10)
        : 100
      const repeatCount = cmd.options.repeat
        ? parseInt(cmd.options.repeat as string, 10)
        : 1
      const numOctaves = cmd.options.octaves
        ? parseInt(cmd.options.octaves as string, 10)
        : 1
      const durationStr = (cmd.options.duration as string) ?? "1/8"
      const durationTicks = parseGrid(durationStr, context.timebase)
      const direction = (cmd.options.pattern as string) ?? "up"
      const channel = cmd.options.channel
        ? parseInt(cmd.options.channel as string, 10)
        : undefined
      let cursor = cmd.options.at
        ? parsePosition(
            cmd.options.at as string,
            context.timebase,
            context.measures,
          )
        : 0

      let pitches: number[] = []
      if (cmd.options.arpeggio) {
        const chord = parseChordSymbol(cmd.options.arpeggio as string)
        const basePitch = 60 + chord.root
        for (let oct = 0; oct < numOctaves; oct++) {
          for (const interval of chord.intervals) {
            pitches.push(basePitch + interval + oct * 12)
          }
        }
      } else if (cmd.options.notes) {
        pitches = (cmd.options.notes as string)
          .split(/[\s,]+/)
          .map((n) => parseNoteSpec(n))
        if (numOctaves > 1) {
          const base = [...pitches]
          for (let oct = 1; oct < numOctaves; oct++) {
            pitches.push(...base.map((p) => p + oct * 12))
          }
        }
      } else {
        throw new Error("gen-pattern requires --arpeggio or --notes")
      }

      pitches = pitches.filter((p) => p >= 0 && p <= 127)
      const sorted = [...pitches].sort((a, b) => a - b)
      let ordered: number[]
      switch (direction) {
        case "down":
          ordered = [...sorted].reverse()
          break
        case "updown":
          ordered = [...sorted, ...sorted.reverse().slice(1, -1)]
          break
        case "downup":
          ordered = [
            ...sorted.reverse(),
            ...sorted.reverse().reverse().slice(1, -1),
          ]
          break
        case "random":
          ordered = [...sorted]
          for (let i = ordered.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[ordered[i], ordered[j]] = [ordered[j], ordered[i]]
          }
          break
        default:
          ordered = sorted
      }

      let rhythmTicks: number[] | undefined
      if (cmd.options.rhythm) {
        rhythmTicks = (cmd.options.rhythm as string)
          .split(/\s+/)
          .map((r) => parseGrid(r, context.timebase))
      }

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

      const allNotes = [...notes, ...newNotes]
      allNotes.sort((a, b) => a.tick - b.tick || a.noteNumber - b.noteNumber)
      return {
        stream: { context, notes: allNotes },
        message: `Generated ${newNotes.length} pattern notes`,
      }
    }

    case "remove": {
      const predicates: ((n: SerializedNote) => boolean)[] = []
      if (cmd.options.from) {
        const ft = parsePosition(
          cmd.options.from as string,
          context.timebase,
          context.measures,
        )
        predicates.push((n) => n.tick >= ft)
      }
      if (cmd.options.to) {
        const tt = parsePosition(
          cmd.options.to as string,
          context.timebase,
          context.measures,
        )
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
      const match = (n: SerializedNote) => predicates.every((p) => p(n))
      let result: SerializedNote[]
      if (cmd.options.nth) {
        const nth = parseInt(cmd.options.nth as string, 10)
        let count = 0
        result = notes.filter((n) => {
          if (match(n)) {
            count++
            return count % nth !== 0
          }
          return true
        })
      } else {
        result = notes.filter((n) => !match(n))
      }
      const removed = notes.length - result.length
      return {
        stream: { context, notes: result },
        message: `Removed ${removed} notes (${result.length} remaining)`,
      }
    }

    case "slice": {
      let fromTick = 0
      let toTick = Number.POSITIVE_INFINITY
      if (cmd.options.from)
        fromTick = parsePosition(
          cmd.options.from as string,
          context.timebase,
          context.measures,
        )
      if (cmd.options.to)
        toTick = parsePosition(
          cmd.options.to as string,
          context.timebase,
          context.measures,
        )
      let sliced = notes.filter((n) => n.tick >= fromTick && n.tick < toTick)
      if (cmd.options.zero === true && sliced.length > 0) {
        sliced = sliced.map((n) => ({ ...n, tick: n.tick - fromTick }))
      }
      return {
        stream: {
          context: { ...context, selection: { fromTick, toTick } },
          notes: sliced,
        },
        message: `Sliced ${sliced.length} notes`,
      }
    }

    case "repeat": {
      const count = parseInt(cmd.args[0], 10)
      if (Number.isNaN(count) || count < 1)
        throw new Error("repeat requires a count >= 1")
      if (notes.length === 0) return { stream, message: "No notes to repeat" }
      const maxEnd = Math.max(...notes.map((n) => n.tick + n.duration))
      const gapTicks = cmd.options.gap
        ? parseGrid(cmd.options.gap as string, context.timebase)
        : 0
      const repeated: SerializedNote[] = []
      for (let i = 0; i < count; i++) {
        const offset = i * (maxEnd + gapTicks)
        for (const note of notes) {
          repeated.push({ ...note, tick: note.tick + offset })
        }
      }
      return {
        stream: { context, notes: repeated },
        message: `Repeated ${notes.length} notes ${count}x (${repeated.length} total)`,
      }
    }

    case "harmonize": {
      const intervalStr = cmd.options.interval as string
      const keyStr = cmd.options.key as string
      if (!intervalStr || !keyStr)
        throw new Error("harmonize requires --interval and --key")
      const keyInfo = parseScaleFull(keyStr)
      const pcToDegree = new Map<number, number>()
      for (let i = 0; i < keyInfo.intervals.length; i++) {
        pcToDegree.set((keyInfo.key + keyInfo.intervals[i]) % 12, i)
      }
      const intervalMap: Record<string, number> = {
        "2nd": 1,
        "3rd": 2,
        "4th": 3,
        "5th": 4,
        "6th": 5,
        "7th": 6,
        octave: 7,
      }
      let steps = intervalMap[intervalStr.toLowerCase()]
      if (steps === undefined) {
        const n = parseInt(intervalStr, 10)
        if (!Number.isNaN(n)) steps = n - 1
        else throw new Error(`Invalid interval: "${intervalStr}"`)
      }
      const doChord = cmd.options.chord === true
      const harmonyNotes: SerializedNote[] = []
      for (const note of notes) {
        const pc = note.noteNumber % 12
        const oct = Math.floor(note.noteNumber / 12)
        const degree = pcToDegree.get(pc)
        if (degree === undefined) continue
        const stepsToUse = doChord ? [2, 4] : [steps]
        for (const s of stepsToUse) {
          const targetDegree = degree + s
          const scaleLen = keyInfo.intervals.length
          const octaveOffset = Math.floor(targetDegree / scaleLen)
          const wrappedDegree =
            ((targetDegree % scaleLen) + scaleLen) % scaleLen
          const hpc = (keyInfo.key + keyInfo.intervals[wrappedDegree]) % 12
          const harmonyNote = (oct + octaveOffset) * 12 + hpc
          if (harmonyNote >= 0 && harmonyNote <= 127) {
            harmonyNotes.push({ ...note, noteNumber: harmonyNote })
          }
        }
      }
      const allNotes = [...notes, ...harmonyNotes]
      allNotes.sort((a, b) => a.tick - b.tick || a.noteNumber - b.noteNumber)
      return {
        stream: { context, notes: allNotes },
        message: `Added ${harmonyNotes.length} harmony notes`,
      }
    }

    case "analyze": {
      const groups = new Map<number, SerializedNote[]>()
      for (const note of notes) {
        const existing = groups.get(note.tick)
        if (existing) existing.push(note)
        else groups.set(note.tick, [note])
      }
      let keyInfo: ReturnType<typeof parseScaleFull> | undefined
      if (cmd.options.key) keyInfo = parseScaleFull(cmd.options.key as string)
      const sortedTicks = [...groups.keys()].sort((a, b) => a - b)
      const results: string[] = []
      for (const tick of sortedTicks) {
        const noteGroup = groups.get(tick)
        if (!noteGroup) continue
        if (noteGroup.length < 2) {
          const noteName = NOTE_NAMES_DISPLAY[noteGroup[0].noteNumber % 12]
          const oct = Math.floor(noteGroup[0].noteNumber / 12) - 1
          results.push(`t${tick}: ${noteName}${oct}`)
          continue
        }
        const pitchClasses = [
          ...new Set(noteGroup.map((n) => n.noteNumber % 12)),
        ]
        const chord = detectBestChord(pitchClasses)
        if (chord) {
          const rootName = NOTE_NAMES_DISPLAY[chord.root]
          let label =
            chord.type === "maj" ? rootName : `${rootName}${chord.type}`
          if (chord.inversion > 0) label += ` (inv ${chord.inversion})`
          if (keyInfo) {
            const degreeIndex = keyInfo.intervals.indexOf(
              (chord.root - keyInfo.key + 12) % 12,
            )
            if (degreeIndex >= 0) label += ` (${DEGREE_NAMES[degreeIndex]})`
          }
          results.push(`t${tick}: ${label}`)
        } else {
          results.push(
            `t${tick}: [${pitchClasses.map((pc) => NOTE_NAMES_DISPLAY[pc]).join(", ")}]`,
          )
        }
      }
      return { stream, message: `Chord analysis:\n${results.join("\n")}` }
    }

    case "thin": {
      let result: SerializedNote[]
      if (cmd.options["max-density"] && cmd.options.per) {
        const maxNotes = parseInt(cmd.options["max-density"] as string, 10)
        const gridTicks = parseGrid(cmd.options.per as string, context.timebase)
        const buckets = new Map<number, SerializedNote[]>()
        for (const note of notes) {
          const bucket = Math.floor(note.tick / gridTicks)
          const existing = buckets.get(bucket)
          if (existing) existing.push(note)
          else buckets.set(bucket, [note])
        }
        result = []
        for (const [, bucketNotes] of buckets) {
          if (bucketNotes.length <= maxNotes) {
            result.push(...bucketNotes)
          } else {
            bucketNotes.sort((a, b) => a.tick - b.tick)
            result.push(...bucketNotes.slice(0, maxNotes))
          }
        }
        result.sort((a, b) => a.tick - b.tick || a.noteNumber - b.noteNumber)
      } else {
        const pct = cmd.args[0] ? parseInt(cmd.args[0], 10) : 50
        result = notes.filter(() => Math.random() * 100 < pct)
      }
      return {
        stream: { context, notes: result },
        message: `Thinned to ${result.length} notes (from ${notes.length})`,
      }
    }

    case "spread": {
      const numVoices = cmd.options.voices
        ? parseInt(cmd.options.voices as string, 10)
        : 2
      const channels = cmd.options.channel
        ? (cmd.options.channel as string)
            .split(",")
            .map((c) => parseInt(c.trim(), 10))
        : Array.from({ length: numVoices }, (_, i) => i)
      const groups = new Map<number, SerializedNote[]>()
      for (const note of notes) {
        const existing = groups.get(note.tick)
        if (existing) existing.push(note)
        else groups.set(note.tick, [note])
      }
      const result: SerializedNote[] = []
      for (const [, noteGroup] of groups) {
        noteGroup.sort((a, b) => a.noteNumber - b.noteNumber)
        for (let i = 0; i < noteGroup.length; i++) {
          const voiceIndex = Math.min(i, numVoices - 1)
          result.push({
            ...noteGroup[i],
            channel: channels[voiceIndex % channels.length],
          })
        }
      }
      result.sort((a, b) => a.tick - b.tick || a.noteNumber - b.noteNumber)
      return {
        stream: { context, notes: result },
        message: `Spread ${notes.length} notes across ${numVoices} voices`,
      }
    }

    case "compress": {
      let result = notes
      if (cmd.options.range) {
        const parts = (cmd.options.range as string).split("-")
        const min = parseInt(parts[0], 10)
        const max = parseInt(parts[1], 10)
        if (notes.length > 0) {
          const currentMin = Math.min(...notes.map((n) => n.velocity))
          const currentMax = Math.max(...notes.map((n) => n.velocity))
          const currentRange = currentMax - currentMin || 1
          result = notes.map((n) => {
            const normalized = (n.velocity - currentMin) / currentRange
            const newVel = Math.round(min + normalized * (max - min))
            return { ...n, velocity: Math.max(0, Math.min(127, newVel)) }
          })
        }
      } else if (cmd.options.ratio) {
        const ratio = parseFloat(cmd.options.ratio as string)
        const mean =
          notes.reduce((sum, n) => sum + n.velocity, 0) / (notes.length || 1)
        result = notes.map((n) => {
          const diff = n.velocity - mean
          const compressed = mean + diff / ratio
          return {
            ...n,
            velocity: Math.max(0, Math.min(127, Math.round(compressed))),
          }
        })
      }
      return {
        stream: { context, notes: result },
        message: `Compressed velocity of ${result.length} notes`,
      }
    }

    case "voice-lead": {
      const vlKeyStr = cmd.options.key as string
      if (!vlKeyStr) throw new Error("voice-lead requires --key")

      // Group notes by tick
      const vlGroups = new Map<number, SerializedNote[]>()
      for (const note of notes) {
        const existing = vlGroups.get(note.tick)
        if (existing) existing.push(note)
        else vlGroups.set(note.tick, [note])
      }

      const vlSortedTicks = [...vlGroups.keys()].sort((a, b) => a - b)
      if (vlSortedTicks.length <= 1) {
        return {
          stream: { context, notes },
          message: "Not enough chords to voice-lead",
        }
      }

      const vlResult: SerializedNote[] = []
      const firstGroup = vlGroups.get(vlSortedTicks[0])
      if (!firstGroup) {
        return { stream: { context, notes }, message: "No notes to voice-lead" }
      }
      let prevPitches = firstGroup
        .map((n) => n.noteNumber)
        .sort((a, b) => a - b)
      vlResult.push(...firstGroup)

      for (let g = 1; g < vlSortedTicks.length; g++) {
        const tick = vlSortedTicks[g]
        const group = vlGroups.get(tick)
        if (!group) continue
        group.sort((a, b) => a.noteNumber - b.noteNumber)

        const revoiced: SerializedNote[] = []
        for (const note of group) {
          const pc = note.noteNumber % 12
          const prevAvg =
            prevPitches.length > 0
              ? prevPitches.reduce((s, p) => s + p, 0) / prevPitches.length
              : note.noteNumber
          let bestPitch = note.noteNumber
          let bestDist = Math.abs(note.noteNumber - prevAvg)
          for (let oct = 1; oct <= 9; oct++) {
            const candidate = oct * 12 + pc
            if (candidate < 0 || candidate > 127) continue
            const dist = Math.abs(candidate - prevAvg)
            if (dist < bestDist) {
              bestDist = dist
              bestPitch = candidate
            }
          }
          revoiced.push({ ...note, noteNumber: bestPitch })
        }
        prevPitches = revoiced.map((n) => n.noteNumber).sort((a, b) => a - b)
        vlResult.push(...revoiced)
      }

      vlResult.sort((a, b) => a.tick - b.tick || a.noteNumber - b.noteNumber)
      return {
        stream: { context, notes: vlResult },
        message: `Voice-led ${vlResult.length} notes across ${vlSortedTicks.length} chords`,
      }
    }

    case "let": {
      const vars: Record<string, string> = { ...context.vars }
      for (const assignment of cmd.args) {
        const eqIndex = assignment.indexOf("=")
        if (eqIndex < 0)
          throw new Error(`Invalid assignment: "${assignment}". Use name=value`)
        vars[assignment.slice(0, eqIndex).trim()] = assignment
          .slice(eqIndex + 1)
          .trim()
      }
      return {
        stream: { context: { ...context, vars }, notes },
        message: `Set ${cmd.args.length} variable(s)`,
      }
    }

    case "run": {
      const script = cmd.args[0]
      if (!script) throw new Error("run requires a script argument")
      const runResult = evaluateRunScript(script, stream)
      return {
        stream: runResult,
        message: `Executed script`,
      }
    }

    case "help": {
      const helpText = [
        "Available commands:",
        "",
        "── Selection ──",
        "  get-notes [--from pos] [--to pos] [--pitch r] [--nth n] [--channel n]",
        "  filter [--from pos] [--to pos] [--pitch r] [--invert] [--nth n] [--random pct]",
        "",
        "── Note Generation ──",
        "  add-notes <notes/chords...> [--at pos] [--duration 1/4] [--each 1/1]",
        "  add-notes --scale c-major [--octave 4] [--each 1/8]",
        "  add-notes --degree I,IV,V,I --key c-major [--each 1/1]",
        "  gen-pattern --arpeggio Cmaj7 [--pattern up] [--duration 1/16] [--repeat 4]",
        "  gen-pattern --notes C4,E4,G4 [--rhythm '1/8 1/8 1/4']",
        "",
        "── Transforms ──",
        "  transpose <semitones>           Shift pitches",
        "  quantize -s <key-scale>         Quantize to scale",
        "  quantize-time -g <grid>         Quantize timing",
        "  velocity <op> [values]          Adjust velocity",
        "  shift <amount>                  Move in time (+120t, -1b, +2m)",
        "  duration <op> [value]           Adjust durations",
        "  humanize [--time n] [--velocity n]  Add variation",
        "  invert [--axis n]              Mirror pitches",
        "  retrograde                      Reverse order",
        "  harmonize --interval 3rd --key c-major  Add harmony",
        "  voice-lead --key c-major        Smooth chord voicings",
        "",
        "── Section Operations ──",
        "  remove [--from pos] [--to pos] [--pitch range] [--nth n]",
        "  slice [--from pos] [--to pos] [--zero]",
        "  repeat <count> [--gap 1/4]",
        "",
        "── Dynamics ──",
        "  thin [percent] [--max-density n --per 1/4]",
        "  spread [--voices n] [--channel 0,1]",
        "  compress [--range 40-100] [--ratio 2]",
        "",
        "── Analysis ──",
        "  analyze [--key c-major]         Identify chords",
        "",
        "── Scripting ──",
        "  let key=c-major tempo=120       Set variables",
        "  run 'for i in 1..4 { add-notes C4 --at m$i-1 }'",
        "  run 'if $count > 4 { transpose 2 } else { transpose -2 }'",
        "",
        "Positions: m1-1 (measure 1 beat 1), t480 (tick 480)",
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
/**
 * Substitute $var references in a command segment using context vars.
 */
function substituteVars(
  segment: string,
  vars: Record<string, string> | undefined,
): string {
  if (!vars) return segment
  return segment.replace(/\$([a-zA-Z_]\w*)/g, (match, name) => {
    return vars[name] ?? match
  })
}

// ─── Inline Scripting Evaluator (for/if/while) ───

interface ScriptToken {
  type: "word" | "pipe" | "lbrace" | "rbrace" | "string"
  value: string
}

interface ScriptCondition {
  left: string
  op: string
  right: string
}

type ScriptNode =
  | { type: "command"; raw: string }
  | { type: "pipeline"; commands: ScriptNode[] }
  | {
      type: "for"
      variable: string
      start: number
      end: number
      body: ScriptNode
    }
  | {
      type: "if"
      condition: ScriptCondition
      thenBranch: ScriptNode
      elseBranch?: ScriptNode
    }
  | {
      type: "while"
      condition: ScriptCondition
      body: ScriptNode
      maxIterations: number
    }

function tokenizeScript(input: string): ScriptToken[] {
  const tokens: ScriptToken[] = []
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++
      continue
    }
    if (ch === "{") {
      tokens.push({ type: "lbrace", value: "{" })
      i++
      continue
    }
    if (ch === "}") {
      tokens.push({ type: "rbrace", value: "}" })
      i++
      continue
    }
    if (ch === "|") {
      tokens.push({ type: "pipe", value: "|" })
      i++
      continue
    }
    if (ch === '"' || ch === "'") {
      const quote = ch
      let str = ""
      i++
      while (i < input.length && input[i] !== quote) {
        if (input[i] === "\\" && i + 1 < input.length) {
          i++
          str += input[i]
        } else {
          str += input[i]
        }
        i++
      }
      if (i < input.length) i++
      tokens.push({ type: "string", value: str })
      continue
    }
    let word = ""
    while (i < input.length && !" \t\n\r{}|\"'".includes(input[i])) {
      word += input[i]
      i++
    }
    if (word) tokens.push({ type: "word", value: word })
  }
  return tokens
}

class ScriptParser {
  private tokens: ScriptToken[]
  private pos: number
  constructor(tokens: ScriptToken[]) {
    this.tokens = tokens
    this.pos = 0
  }
  peek(): ScriptToken | undefined {
    return this.tokens[this.pos]
  }
  advance(): ScriptToken {
    const t = this.tokens[this.pos]
    if (!t) throw new Error("Unexpected end of script")
    this.pos++
    return t
  }
  expect(type: ScriptToken["type"], value?: string): ScriptToken {
    const t = this.advance()
    if (t.type !== type || (value !== undefined && t.value !== value))
      throw new Error(
        `Expected ${type}${value ? ` "${value}"` : ""}, got ${t.type} "${t.value}"`,
      )
    return t
  }
  isAtEnd(): boolean {
    return this.pos >= this.tokens.length
  }

  parse(): ScriptNode {
    return this.parsePipeline()
  }

  private parsePipeline(): ScriptNode {
    const first = this.parseStatement()
    const commands: ScriptNode[] = [first]
    while (!this.isAtEnd() && this.peek()?.type === "pipe") {
      this.advance()
      commands.push(this.parseStatement())
    }
    return commands.length === 1 ? commands[0] : { type: "pipeline", commands }
  }

  private parseStatement(): ScriptNode {
    const t = this.peek()
    if (t?.type === "word") {
      if (t.value === "for") return this.parseFor()
      if (t.value === "if") return this.parseIf()
      if (t.value === "while") return this.parseWhile()
    }
    return this.parseCommand()
  }

  private parseCommand(): ScriptNode {
    const parts: string[] = []
    while (!this.isAtEnd()) {
      const t = this.peek()
      if (!t || t.type === "pipe" || t.type === "rbrace" || t.type === "lbrace")
        break
      if (
        t.type === "word" &&
        ["for", "if", "while", "else"].includes(t.value) &&
        parts.length === 0
      )
        break
      const token = this.advance()
      parts.push(token.type === "string" ? `"${token.value}"` : token.value)
    }
    if (parts.length === 0) throw new Error("Expected a command")
    return { type: "command", raw: parts.join(" ") }
  }

  private parseFor(): ScriptNode {
    this.expect("word", "for")
    const varName = this.advance().value
    this.expect("word", "in")
    const rangeStr = this.advance().value
    const match = rangeStr.match(/^(\d+)\.\.(\d+)$/)
    if (!match)
      throw new Error(`Invalid range: "${rangeStr}". Expected: start..end`)
    this.expect("lbrace")
    const body = this.parsePipeline()
    this.expect("rbrace")
    return {
      type: "for",
      variable: varName,
      start: parseInt(match[1], 10),
      end: parseInt(match[2], 10),
      body,
    }
  }

  private parseIf(): ScriptNode {
    this.expect("word", "if")
    const condition = this.parseCondition()
    this.expect("lbrace")
    const thenBody = this.parsePipeline()
    this.expect("rbrace")
    let elseBody: ScriptNode | undefined
    if (!this.isAtEnd() && this.peek()?.value === "else") {
      this.advance()
      this.expect("lbrace")
      elseBody = this.parsePipeline()
      this.expect("rbrace")
    }
    return { type: "if", condition, thenBranch: thenBody, elseBranch: elseBody }
  }

  private parseWhile(): ScriptNode {
    this.expect("word", "while")
    const condition = this.parseCondition()
    this.expect("lbrace")
    const body = this.parsePipeline()
    this.expect("rbrace")
    return { type: "while", condition, body, maxIterations: 1000 }
  }

  private parseCondition(): ScriptCondition {
    const left = this.advance().value
    const op = this.advance().value
    const right = this.advance().value
    if (![">", "<", ">=", "<=", "==", "!="].includes(op))
      throw new Error(`Invalid operator: "${op}"`)
    return { left, op, right }
  }
}

function resolveScriptValue(
  value: string,
  vars: Record<string, string>,
): string {
  return value.replace(
    /\$([a-zA-Z_]\w*)/g,
    (match, name) => vars[name] ?? match,
  )
}

function evalScriptCondition(
  condition: ScriptCondition,
  vars: Record<string, string>,
): boolean {
  const left = resolveScriptValue(condition.left, vars)
  const right = resolveScriptValue(condition.right, vars)
  const leftNum = Number(left)
  const rightNum = Number(right)
  if (!Number.isNaN(leftNum) && !Number.isNaN(rightNum)) {
    switch (condition.op) {
      case ">":
        return leftNum > rightNum
      case "<":
        return leftNum < rightNum
      case ">=":
        return leftNum >= rightNum
      case "<=":
        return leftNum <= rightNum
      case "==":
        return leftNum === rightNum
      case "!=":
        return leftNum !== rightNum
    }
  }
  switch (condition.op) {
    case "==":
      return left === right
    case "!=":
      return left !== right
    default:
      return false
  }
}

function evalScriptNode(
  node: ScriptNode,
  stream: NoteStream,
  executor: (command: string, stream: NoteStream) => NoteStream,
): NoteStream {
  switch (node.type) {
    case "command": {
      const vars = stream.context.vars ?? {}
      const resolved = resolveScriptValue(node.raw, vars)
      return executor(resolved, stream)
    }
    case "pipeline": {
      let current = stream
      for (const cmd of node.commands) {
        current = evalScriptNode(cmd, current, executor)
      }
      return current
    }
    case "for": {
      let current = stream
      for (let i = node.start; i <= node.end; i++) {
        const vars = {
          ...(current.context.vars ?? {}),
          [node.variable]: String(i),
        }
        current = { ...current, context: { ...current.context, vars } }
        current = evalScriptNode(node.body, current, executor)
      }
      return current
    }
    case "if": {
      const vars = stream.context.vars ?? {}
      if (evalScriptCondition(node.condition, vars)) {
        return evalScriptNode(node.thenBranch, stream, executor)
      }
      if (node.elseBranch) {
        return evalScriptNode(node.elseBranch, stream, executor)
      }
      return stream
    }
    case "while": {
      let current = stream
      let iterations = 0
      while (iterations < node.maxIterations) {
        const vars = current.context.vars ?? {}
        if (!evalScriptCondition(node.condition, vars)) break
        current = evalScriptNode(node.body, current, executor)
        iterations++
      }
      return current
    }
  }
}

function evaluateRunScript(script: string, stream: NoteStream): NoteStream {
  const tokens = tokenizeScript(script)
  if (tokens.length === 0) return stream
  const parser = new ScriptParser(tokens)
  const ast = parser.parse()
  return evalScriptNode(ast, stream, (command, s) => {
    const cmd = parseCommandString(command)
    if (!cmd.name) return s
    const result = executeOneCommand(cmd, s)
    return result.stream
  })
}

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
    const substituted = substituteVars(segment, currentStream.context.vars)
    const cmd = parseCommandString(substituted)
    if (!cmd.name) continue
    const result = executeOneCommand(cmd, currentStream)
    currentStream = result.stream
    messages.push(result.message)
  }

  return { stream: currentStream, message: messages.join("\n") }
}
