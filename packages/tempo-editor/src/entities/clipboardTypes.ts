import { z } from "zod"

export const ItemClipboardDataSchema = z.object({
  id: z.number(),
  tick: z.number(),
  bpm: z.number(),
})

export const ClipboardDataSchema = z.object({
  type: z.literal("tempo_events"),
  items: z.array(ItemClipboardDataSchema),
})

export type ClipboardData = z.infer<typeof ClipboardDataSchema>
