const chordValues = [
  // Triads
  "maj",
  "min",
  "dim",
  "aug",
  "sus2",
  "sus4",
  // Sevenths
  "maj7",
  "7",
  "min7",
  "dim7",
  "m7b5",
  "minmaj7",
  "aug7",
  // Extended
  "9",
  "maj9",
  "min9",
  "11",
  "13",
  // Added
  "add9",
  "add11",
  "6",
  "min6",
  // Power
  "5",
] as const

export type ChordType = (typeof chordValues)[number]

export namespace Chord {
  export const values = chordValues

  /** Returns the intervals (in semitones from root) for a given chord type */
  export const getIntervals = (chord: ChordType): readonly number[] => {
    switch (chord) {
      // Triads
      case "maj":
        return [0, 4, 7]
      case "min":
        return [0, 3, 7]
      case "dim":
        return [0, 3, 6]
      case "aug":
        return [0, 4, 8]
      case "sus2":
        return [0, 2, 7]
      case "sus4":
        return [0, 5, 7]
      // Sevenths
      case "maj7":
        return [0, 4, 7, 11]
      case "7":
        return [0, 4, 7, 10]
      case "min7":
        return [0, 3, 7, 10]
      case "dim7":
        return [0, 3, 6, 9]
      case "m7b5":
        return [0, 3, 6, 10]
      case "minmaj7":
        return [0, 3, 7, 11]
      case "aug7":
        return [0, 4, 8, 10]
      // Extended
      case "9":
        return [0, 4, 7, 10, 14]
      case "maj9":
        return [0, 4, 7, 11, 14]
      case "min9":
        return [0, 3, 7, 10, 14]
      case "11":
        return [0, 4, 7, 10, 14, 17]
      case "13":
        return [0, 4, 7, 10, 14, 17, 21]
      // Added
      case "add9":
        return [0, 4, 7, 14]
      case "add11":
        return [0, 4, 7, 17]
      case "6":
        return [0, 4, 7, 9]
      case "min6":
        return [0, 3, 7, 9]
      // Power
      case "5":
        return [0, 7]
    }
  }

  /** Get the pitch classes (0-11) for a chord with a given root */
  export const getPitchClasses = (root: number, chord: ChordType): number[] => {
    return getIntervals(chord).map((i) => (root + i) % 12)
  }
}
