export interface PitchSegment {
  start_time: number
  end_time: number
  avg_frequency: number
  avg_confidence: number
  midi_note: number
}

export interface InterpretedNote {
  note_number: number
  tick: number
  duration: number
  velocity: number
}

export interface RhythmInterpretationResponse {
  notes: InterpretedNote[]
  detected_tempo: number
  tempo_confidence: "high" | "medium" | "low"
  time_signature: [number, number]
  // New key detection fields
  detected_key: number // 0-11 (C=0)
  detected_scale: "major" | "minor"
  key_confidence: "high" | "medium" | "low"
  pitch_offset_cents: number
  key_source: "user_provided" | "detected_confident" | "detected_low_confidence"
}
