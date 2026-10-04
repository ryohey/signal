import { z } from "zod"

export const ItemClipboardDataSchema = z.object({
  id: z.number(),
  tick: z.number(),
  value: z.number(),
})

export const ValueEventTypeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pitchBend") }),
  z.object({ type: z.literal("controller"), controllerType: z.number() }),
])

export const ClipboardDataSchema = z.object({
  type: z.literal("control_events"),
  valueEventType: ValueEventTypeSchema,
  events: z.array(ItemClipboardDataSchema),
})

export type ClipboardData = z.infer<typeof ClipboardDataSchema>
