const scaleValues = [
  // Basic
  "major",
  "minor",
  // Minor
  "harmonicMajor",
  "harmonicMinor",
  // Melodic
  "melodicMinor",
  // Mode
  "ionian",
  "dorian",
  "phrygian",
  "lydian",
  "mixolydian",
  "aeolian",
  "locrian",
  // Pentatonic
  "majorPentatonic",
  "minorPentatonic",
  // Blues
  "majorBlues",
  "minorBlues",
  // Diminished
  "halfWholeDiminished",
  "wholeHalfDiminished",
  // Whole Tone
  "wholeTone",
] as const

export type Scale = (typeof scaleValues)[number]

export namespace Scale {
  export const values = scaleValues

  // An array of 12 integers representing the notes in the scale. 0 is C, 1 is C#, 2 is D, etc.
  export const getIntegerNotation = (scale: Scale): readonly number[] => {
    switch (scale) {
      case "major":
        return [0, 2, 4, 5, 7, 9, 11]
      case "minor":
        return [0, 2, 3, 5, 7, 8, 10]
      case "harmonicMinor":
        return [0, 2, 3, 5, 7, 8, 11]
      case "harmonicMajor":
        return [0, 2, 4, 5, 7, 8, 11]
      case "melodicMinor":
        return [0, 2, 3, 5, 7, 9, 11]
      case "ionian":
        return [0, 2, 4, 5, 7, 9, 11]
      case "dorian":
        return [0, 2, 3, 5, 7, 9, 10]
      case "phrygian":
        return [0, 1, 3, 5, 7, 8, 10]
      case "lydian":
        return [0, 2, 4, 6, 7, 9, 11]
      case "mixolydian":
        return [0, 2, 4, 5, 7, 9, 10]
      case "aeolian":
        return [0, 2, 3, 5, 7, 8, 10]
      case "locrian":
        return [0, 1, 3, 5, 6, 8, 10]
      case "majorPentatonic":
        return [0, 2, 4, 7, 9]
      case "minorPentatonic":
        return [0, 3, 5, 7, 10]
      case "majorBlues":
        return [0, 2, 3, 4, 7, 9]
      case "minorBlues":
        return [0, 3, 5, 6, 7, 10]
      case "halfWholeDiminished":
        return [0, 1, 3, 4, 6, 7, 9, 10]
      case "wholeHalfDiminished":
        return [0, 2, 3, 5, 6, 8, 9, 11]
      case "wholeTone":
        return [0, 2, 4, 6, 8, 10]
    }
  }
}
