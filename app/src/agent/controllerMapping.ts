/**
 * MIDI Controller name to CC number mapping.
 * Supports exact names, common aliases, and CC numbers as strings.
 */

// Standard MIDI CC numbers with their official names
const MIDI_CONTROLLERS: Record<number, string> = {
  0: "Bank Select",
  1: "Modulation",
  2: "Breath Controller",
  4: "Foot Controller",
  5: "Portamento Time",
  6: "Data Entry MSB",
  7: "Volume",
  8: "Balance",
  10: "Pan",
  11: "Expression",
  12: "Effect Control 1",
  13: "Effect Control 2",
  16: "General Purpose 1",
  17: "General Purpose 2",
  18: "General Purpose 3",
  19: "General Purpose 4",
  64: "Sustain Pedal",
  65: "Portamento",
  66: "Sostenuto",
  67: "Soft Pedal",
  68: "Legato Footswitch",
  69: "Hold 2",
  70: "Sound Variation",
  71: "Timbre/Harmonic Content",
  72: "Release Time",
  73: "Attack Time",
  74: "Brightness",
  75: "Sound Control 6",
  76: "Sound Control 7",
  77: "Sound Control 8",
  78: "Sound Control 9",
  79: "Sound Control 10",
  80: "General Purpose 5",
  81: "General Purpose 6",
  82: "General Purpose 7",
  83: "General Purpose 8",
  84: "Portamento Control",
  91: "Reverb",
  92: "Tremolo",
  93: "Chorus",
  94: "Detune",
  95: "Phaser",
  96: "Data Increment",
  97: "Data Decrement",
  98: "NRPN LSB",
  99: "NRPN MSB",
  100: "RPN LSB",
  101: "RPN MSB",
  120: "All Sound Off",
  121: "Reset All Controllers",
  122: "Local Control",
  123: "All Notes Off",
  124: "Omni Off",
  125: "Omni On",
  126: "Mono On",
  127: "Poly On",
}

// Common aliases mapping to CC numbers
const CONTROLLER_ALIASES: Record<string, number> = {
  // Volume aliases
  volume: 7,
  vol: 7,
  main: 7,
  "main volume": 7,

  // Pan aliases
  pan: 10,
  panning: 10,
  panpot: 10,
  balance: 8,

  // Expression aliases
  expression: 11,
  expr: 11,
  dynamics: 11,

  // Modulation aliases
  modulation: 1,
  mod: 1,
  "mod wheel": 1,
  modwheel: 1,
  vibrato: 1,

  // Sustain/pedal aliases
  sustain: 64,
  "sustain pedal": 64,
  hold: 64,
  "hold pedal": 64,
  "damper pedal": 64,
  damper: 64,
  pedal: 64,

  // Soft pedal aliases
  "soft pedal": 67,
  soft: 67,
  "una corda": 67,

  // Sostenuto aliases
  sostenuto: 66,
  "sostenuto pedal": 66,

  // Breath controller
  breath: 2,
  "breath controller": 2,

  // Foot controller
  foot: 4,
  "foot controller": 4,
  "foot pedal": 4,

  // Portamento
  portamento: 65,
  "portamento time": 5,
  glide: 5,
  "glide time": 5,

  // Effects
  reverb: 91,
  "reverb depth": 91,
  "reverb level": 91,

  tremolo: 92,
  "tremolo depth": 92,

  chorus: 93,
  "chorus depth": 93,
  "chorus level": 93,

  detune: 94,
  "detune depth": 94,

  phaser: 95,
  "phaser depth": 95,

  // Sound shaping
  brightness: 74,
  "filter cutoff": 74,
  cutoff: 74,

  resonance: 71,
  "filter resonance": 71,
  timbre: 71,

  attack: 73,
  "attack time": 73,

  release: 72,
  "release time": 72,

  // Bank select
  bank: 0,
  "bank select": 0,
}

export interface ControllerInfo {
  controllerNumber: number
  controllerName: string
}

/**
 * Resolves a controller name or number to its MIDI CC number.
 * Supports exact names, aliases, CC numbers, and "CC" prefix notation.
 *
 * @param nameOrNumber - Controller name (string) or CC number (number or string like "CC64")
 * @returns ControllerInfo if found, undefined otherwise
 */
export function getControllerNumber(
  nameOrNumber: string | number,
): ControllerInfo | undefined {
  // If it's already a number, validate and return
  if (typeof nameOrNumber === "number") {
    if (nameOrNumber < 0 || nameOrNumber > 127) {
      return undefined
    }
    return {
      controllerNumber: nameOrNumber,
      controllerName: MIDI_CONTROLLERS[nameOrNumber] ?? `CC${nameOrNumber}`,
    }
  }

  const normalized = nameOrNumber.toLowerCase().trim()

  // Check for "CC" prefix notation (e.g., "CC64", "cc7")
  const ccMatch = normalized.match(/^cc\s*(\d+)$/i)
  if (ccMatch) {
    const num = parseInt(ccMatch[1], 10)
    if (num >= 0 && num <= 127) {
      return {
        controllerNumber: num,
        controllerName: MIDI_CONTROLLERS[num] ?? `CC${num}`,
      }
    }
    return undefined
  }

  // Check if it's a plain number string
  const numericValue = parseInt(normalized, 10)
  if (!isNaN(numericValue) && normalized === numericValue.toString()) {
    if (numericValue >= 0 && numericValue <= 127) {
      return {
        controllerNumber: numericValue,
        controllerName: MIDI_CONTROLLERS[numericValue] ?? `CC${numericValue}`,
      }
    }
    return undefined
  }

  // Check aliases (case-insensitive)
  if (normalized in CONTROLLER_ALIASES) {
    const controllerNumber = CONTROLLER_ALIASES[normalized]
    return {
      controllerNumber,
      controllerName:
        MIDI_CONTROLLERS[controllerNumber] ?? `CC${controllerNumber}`,
    }
  }

  // Check exact MIDI controller names (case-insensitive)
  for (const [numStr, name] of Object.entries(MIDI_CONTROLLERS)) {
    if (name.toLowerCase() === normalized) {
      const num = parseInt(numStr, 10)
      return {
        controllerNumber: num,
        controllerName: name,
      }
    }
  }

  // Partial match on MIDI controller names
  for (const [numStr, name] of Object.entries(MIDI_CONTROLLERS)) {
    if (
      name.toLowerCase().includes(normalized) ||
      normalized.includes(name.toLowerCase())
    ) {
      const num = parseInt(numStr, 10)
      return {
        controllerNumber: num,
        controllerName: name,
      }
    }
  }

  return undefined
}

/**
 * Gets the name for a controller number.
 *
 * @param controllerNumber - MIDI CC number (0-127)
 * @returns The controller name
 */
export function getControllerName(controllerNumber: number): string {
  if (controllerNumber < 0 || controllerNumber > 127) {
    return `CC${controllerNumber}`
  }
  return MIDI_CONTROLLERS[controllerNumber] ?? `CC${controllerNumber}`
}

/**
 * Returns the commonly used controllers with their names.
 * Useful for documentation in the agent system prompt.
 */
export function getCommonControllers(): Array<{
  name: string
  cc: number
  description: string
}> {
  return [
    { name: "volume", cc: 7, description: "Track volume (0-127)" },
    {
      name: "pan",
      cc: 10,
      description: "Stereo position (0=left, 64=center, 127=right)",
    },
    { name: "expression", cc: 11, description: "Dynamic expression (0-127)" },
    {
      name: "modulation",
      cc: 1,
      description: "Vibrato/modulation depth (0-127)",
    },
    { name: "sustain", cc: 64, description: "Sustain pedal (0=off, 127=on)" },
    { name: "reverb", cc: 91, description: "Reverb depth (0-127)" },
    { name: "chorus", cc: 93, description: "Chorus depth (0-127)" },
    {
      name: "brightness",
      cc: 74,
      description: "Filter cutoff/brightness (0-127)",
    },
    { name: "attack", cc: 73, description: "Attack time (0-127)" },
    { name: "release", cc: 72, description: "Release time (0-127)" },
  ]
}
