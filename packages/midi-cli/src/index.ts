// Programmatic API exports

export {
  contextFromSong,
  loadMidiFile,
  notesFromTrack,
  readNoteStream,
  saveMidiFile,
  writeNoteStream,
} from "./io.js"
export { isChordSymbol, parseChord } from "./parse/chord.js"
export { parseGrid } from "./parse/grid.js"
export {
  parseNoteRange,
  parseNoteSpec,
  parseVelocityRange,
} from "./parse/noteRange.js"
export { parsePosition } from "./parse/position.js"
export { parseScale } from "./parse/scale.js"
export type { ChordType } from "./theory/Chord.js"
export { Chord } from "./theory/Chord.js"
export {
  detectBestChord,
  detectChord,
  formatChord,
} from "./theory/chordDetection.js"
export type { DegreeInfo } from "./theory/Degree.js"
export { parseDegree } from "./theory/Degree.js"
export { KeySignature } from "./theory/KeySignature.js"
export { Scale } from "./theory/Scale.js"
export type {
  NoteStream,
  NoteStreamContext,
  SerializedMeasure,
  SerializedNote,
} from "./types.js"
