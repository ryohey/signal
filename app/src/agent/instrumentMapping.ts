/**
 * GM Level 1 instrument name to MIDI program number mapping.
 * Supports exact names, common aliases, and partial matching.
 */

// Complete GM Level 1 instrument list (program numbers 0-127)
const GM_INSTRUMENTS: readonly string[] = [
  // Piano (0-7)
  "Acoustic Grand Piano",
  "Bright Acoustic Piano",
  "Electric Grand Piano",
  "Honky-tonk Piano",
  "Electric Piano 1",
  "Electric Piano 2",
  "Harpsichord",
  "Clavinet",
  // Chromatic Percussion (8-15)
  "Celesta",
  "Glockenspiel",
  "Music Box",
  "Vibraphone",
  "Marimba",
  "Xylophone",
  "Tubular Bells",
  "Dulcimer",
  // Organ (16-23)
  "Drawbar Organ",
  "Percussive Organ",
  "Rock Organ",
  "Church Organ",
  "Reed Organ",
  "Accordion",
  "Harmonica",
  "Tango Accordion",
  // Guitar (24-31)
  "Acoustic Guitar (nylon)",
  "Acoustic Guitar (steel)",
  "Electric Guitar (jazz)",
  "Electric Guitar (clean)",
  "Electric Guitar (muted)",
  "Overdriven Guitar",
  "Distortion Guitar",
  "Guitar Harmonics",
  // Bass (32-39)
  "Acoustic Bass",
  "Electric Bass (finger)",
  "Electric Bass (pick)",
  "Fretless Bass",
  "Slap Bass 1",
  "Slap Bass 2",
  "Synth Bass 1",
  "Synth Bass 2",
  // Strings (40-47)
  "Violin",
  "Viola",
  "Cello",
  "Contrabass",
  "Tremolo Strings",
  "Pizzicato Strings",
  "Orchestral Harp",
  "Timpani",
  // Ensemble (48-55)
  "String Ensemble 1",
  "String Ensemble 2",
  "Synth Strings 1",
  "Synth Strings 2",
  "Choir Aahs",
  "Voice Oohs",
  "Synth Choir",
  "Orchestra Hit",
  // Brass (56-63)
  "Trumpet",
  "Trombone",
  "Tuba",
  "Muted Trumpet",
  "French Horn",
  "Brass Section",
  "Synth Brass 1",
  "Synth Brass 2",
  // Reed (64-71)
  "Soprano Sax",
  "Alto Sax",
  "Tenor Sax",
  "Baritone Sax",
  "Oboe",
  "English Horn",
  "Bassoon",
  "Clarinet",
  // Pipe (72-79)
  "Piccolo",
  "Flute",
  "Recorder",
  "Pan Flute",
  "Blown Bottle",
  "Shakuhachi",
  "Whistle",
  "Ocarina",
  // Synth Lead (80-87)
  "Lead 1 (square)",
  "Lead 2 (sawtooth)",
  "Lead 3 (calliope)",
  "Lead 4 (chiff)",
  "Lead 5 (charang)",
  "Lead 6 (voice)",
  "Lead 7 (fifths)",
  "Lead 8 (bass + lead)",
  // Synth Pad (88-95)
  "Pad 1 (new age)",
  "Pad 2 (warm)",
  "Pad 3 (polysynth)",
  "Pad 4 (choir)",
  "Pad 5 (bowed)",
  "Pad 6 (metallic)",
  "Pad 7 (halo)",
  "Pad 8 (sweep)",
  // Synth Effects (96-103)
  "FX 1 (rain)",
  "FX 2 (soundtrack)",
  "FX 3 (crystal)",
  "FX 4 (atmosphere)",
  "FX 5 (brightness)",
  "FX 6 (goblins)",
  "FX 7 (echoes)",
  "FX 8 (sci-fi)",
  // Ethnic (104-111)
  "Sitar",
  "Banjo",
  "Shamisen",
  "Koto",
  "Kalimba",
  "Bagpipe",
  "Fiddle",
  "Shanai",
  // Percussive (112-119)
  "Tinkle Bell",
  "Agogo",
  "Steel Drums",
  "Woodblock",
  "Taiko Drum",
  "Melodic Tom",
  "Synth Drum",
  "Reverse Cymbal",
  // Sound Effects (120-127)
  "Guitar Fret Noise",
  "Breath Noise",
  "Seashore",
  "Bird Tweet",
  "Telephone Ring",
  "Helicopter",
  "Applause",
  "Gunshot",
] as const

// Common aliases mapping to program numbers
const ALIASES: Record<string, number> = {
  // Piano aliases
  piano: 0,
  "grand piano": 0,
  "acoustic piano": 0,
  keys: 0,
  keyboard: 0,
  // Electric piano
  "electric piano": 4,
  "e-piano": 4,
  rhodes: 4,
  wurlitzer: 5,
  // Organ aliases
  organ: 16,
  "hammond organ": 16,
  "b3 organ": 16,
  "church organ": 19,
  // Guitar aliases
  guitar: 24,
  "acoustic guitar": 24,
  "nylon guitar": 24,
  "classical guitar": 24,
  "steel guitar": 25,
  "electric guitar": 27,
  "clean guitar": 27,
  "jazz guitar": 26,
  "distorted guitar": 30,
  distortion: 30,
  overdrive: 29,
  // Bass aliases
  bass: 32,
  "acoustic bass": 32,
  "upright bass": 32,
  "double bass": 32,
  "electric bass": 33,
  "finger bass": 33,
  "pick bass": 34,
  fretless: 35,
  "slap bass": 36,
  "synth bass": 38,
  // String aliases
  violin: 40,
  fiddle: 110,
  viola: 41,
  cello: 42,
  contrabass: 43,
  strings: 48,
  "string ensemble": 48,
  orchestra: 48,
  harp: 46,
  // Brass aliases
  trumpet: 56,
  trombone: 57,
  tuba: 58,
  "french horn": 60,
  horn: 60,
  brass: 61,
  "brass section": 61,
  // Woodwind aliases
  sax: 65,
  saxophone: 65,
  "alto sax": 65,
  "tenor sax": 66,
  "soprano sax": 64,
  "baritone sax": 67,
  oboe: 68,
  bassoon: 70,
  clarinet: 71,
  flute: 73,
  piccolo: 72,
  recorder: 74,
  // Voice aliases
  choir: 52,
  vocals: 52,
  voice: 53,
  // Synth aliases
  synth: 80,
  "synth lead": 80,
  lead: 80,
  pad: 88,
  "synth pad": 88,
  // Percussion (non-drum kit)
  vibes: 11,
  vibraphone: 11,
  marimba: 12,
  xylophone: 13,
  bells: 14,
  "tubular bells": 14,
  timpani: 47,
  "steel drums": 114,
  steelpan: 114,
}

// Drum-related keywords
const DRUM_KEYWORDS = [
  "drum",
  "drums",
  "drum kit",
  "drumkit",
  "percussion",
  "beat",
  "rhythm",
  "kit",
  "snare",
  "kick",
  "hi-hat",
  "hihat",
  "cymbal",
]

export interface InstrumentInfo {
  programNumber: number
  isDrums: boolean
  instrumentName: string
}

/**
 * Resolves an instrument name to its MIDI program number.
 * Supports exact GM names, aliases, and partial matching.
 *
 * @param name - The instrument name to look up
 * @returns InstrumentInfo if found, undefined otherwise
 */
export function getInstrumentProgramNumber(
  name: string,
): InstrumentInfo | undefined {
  const normalized = name.toLowerCase().trim()

  // Check for drum keywords first
  if (DRUM_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return {
      programNumber: 0,
      isDrums: true,
      instrumentName: "Standard Drum Kit",
    }
  }

  // Check exact GM name match (case-insensitive)
  const exactIndex = GM_INSTRUMENTS.findIndex(
    (inst) => inst.toLowerCase() === normalized,
  )
  if (exactIndex !== -1) {
    return {
      programNumber: exactIndex,
      isDrums: false,
      instrumentName: GM_INSTRUMENTS[exactIndex],
    }
  }

  // Check aliases
  if (normalized in ALIASES) {
    const programNumber = ALIASES[normalized]
    return {
      programNumber,
      isDrums: false,
      instrumentName: GM_INSTRUMENTS[programNumber],
    }
  }

  // Partial match - find first instrument containing the search term
  const partialIndex = GM_INSTRUMENTS.findIndex((inst) =>
    inst.toLowerCase().includes(normalized),
  )
  if (partialIndex !== -1) {
    return {
      programNumber: partialIndex,
      isDrums: false,
      instrumentName: GM_INSTRUMENTS[partialIndex],
    }
  }

  // Reverse partial match - check if search term contains any instrument name
  for (let i = 0; i < GM_INSTRUMENTS.length; i++) {
    const inst = GM_INSTRUMENTS[i].toLowerCase()
    // Only match if the instrument name is a significant part of the search
    if (normalized.includes(inst) && inst.length > 3) {
      return {
        programNumber: i,
        isDrums: false,
        instrumentName: GM_INSTRUMENTS[i],
      }
    }
  }

  return undefined
}

/**
 * Gets the GM instrument name for a program number.
 *
 * @param programNumber - MIDI program number (0-127)
 * @returns The GM instrument name
 */
export function getInstrumentName(programNumber: number): string {
  if (programNumber < 0 || programNumber > 127) {
    return `Program ${programNumber}`
  }
  return GM_INSTRUMENTS[programNumber]
}

/**
 * Returns all GM instrument names.
 */
export function getAllInstruments(): readonly string[] {
  return GM_INSTRUMENTS
}
