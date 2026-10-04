import { z } from "zod"

export const PianoNotesClipboardDataSchema = z.object({
  type: z.literal("piano_notes"),
  notes: z.array(z.any()), // NoteEvent[]
})

export type PianoNotesClipboardData = z.infer<
  typeof PianoNotesClipboardDataSchema
>
