import { SetTempoEvent } from "midifile-ts"
import { NoteEvent, TrackEvent, TrackEventOf } from "../track"

export interface PianoNotesClipboardData {
  readonly type: "piano_notes"
  readonly notes: NoteEvent[]
}

export const isPianoNotesClipboardData = (
  x: any,
): x is PianoNotesClipboardData => x.type === "piano_notes" && "notes" in x

export interface ArrangeNotesClipboardData {
  readonly type: "arrange_notes"
  readonly notes: { [key: number]: TrackEvent[] }
  readonly selectedTrackIndex: number
}

export const isArrangeNotesClipboardData = (
  x: any,
): x is ArrangeNotesClipboardData =>
  x.type === "arrange_notes" && "notes" in x && "selectedTrackIndex" in x

export interface ControlEventsClipboardData {
  readonly type: "control_events"
  readonly events: readonly TrackEvent[]
}

export const isControlEventsClipboardData = (
  x: any,
): x is ControlEventsClipboardData =>
  x.type === "control_events" && "events" in x

export interface TempoEventsClipboardData {
  readonly type: "tempo_events"
  readonly events: TrackEventOf<SetTempoEvent>[]
}

export const isTempoEventsClipboardData = (
  x: any,
): x is ControlEventsClipboardData => x.type === "tempo_events" && "events" in x
