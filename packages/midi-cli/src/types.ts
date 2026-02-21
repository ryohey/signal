export interface SerializedNote {
  tick: number
  duration: number
  noteNumber: number // 0-127
  velocity: number // 0-127
  channel?: number
  id?: number
}

export interface SerializedMeasure {
  tick: number
  measure: number
  numerator: number
  denominator: number
}

export interface NoteStreamContext {
  timebase: number // ticks per quarter note (e.g. 480)
  measures: SerializedMeasure[]
  selection?: {
    fromTick: number
    toTick: number
  }
}

export interface NoteStream {
  context: NoteStreamContext
  notes: SerializedNote[]
}
