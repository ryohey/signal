import { SetTempoEvent } from "midifile-ts"
import { NoteEvent, TrackEvent, TrackEventOf } from "../track"

export interface PianoNotesClipboardData {
  type: "piano_notes"
  notes: NoteEvent[]
}

export const isPianoNotesClipboardData = (
  x: any,
): x is PianoNotesClipboardData => x.type === "piano_notes" && "notes" in x

export interface ArrangeNotesClipboardData {
  type: "arrange_notes"
  notes: { [key: number]: TrackEvent[] }
  selectedTrackIndex: number
}

export const isArrangeNotesClipboardData = (
  x: any,
): x is ArrangeNotesClipboardData =>
  x.type === "arrange_notes" && "notes" in x && "selectedTrackIndex" in x

export interface ControlEventsClipboardData {
  type: "control_events"
  events: readonly TrackEvent[]
}

export const isControlEventsClipboardData = (
  x: any,
): x is ControlEventsClipboardData =>
  x.type === "control_events" && "events" in x

export interface TempoEventsClipboardData {
  type: "tempo_events"
  events: TrackEventOf<SetTempoEvent>[]
}

export const isTempoEventsClipboardData = (
  x: any,
): x is ControlEventsClipboardData => x.type === "tempo_events" && "events" in x
