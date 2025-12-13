import { z } from "zod"

export const PianoNotesClipboardDataSchema = z.object({
  type: z.literal("piano_notes"),
  notes: z.array(z.any()), // NoteEvent[]
})

export type PianoNotesClipboardData = z.infer<
  typeof PianoNotesClipboardDataSchema
>

export const ArrangeNotesClipboardDataSchema = z.object({
  type: z.literal("arrange_notes"),
  notes: z.record(
    z.union([z.number(), z.string()]).describe("trackIndex"),
    z.array(z.any().describe("TrackEvent"))
  ),
  selectedTrackIndex: z.number(),
})

export type ArrangeNotesClipboardData = z.infer<
  typeof ArrangeNotesClipboardDataSchema
>

export const ControlEventsClipboardDataSchema = z.object({
  type: z.literal("control_events"),
  events: z.array(z.any().describe("TrackEvent")),
})

export type ControlEventsClipboardData = z.infer<
  typeof ControlEventsClipboardDataSchema
>

export const TempoEventsClipboardDataSchema = z.object({
  type: z.literal("tempo_events"),
  events: z.array(z.any().describe("TrackEventOf<SetTempoEvent>")),
})

export type TempoEventsClipboardData = z.infer<
  typeof TempoEventsClipboardDataSchema
>
