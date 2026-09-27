import { z } from "zod"

export const ArrangeEventsClipboardDataSchema = z.object({
  type: z.literal("arrange_events"),
  events: z.record(
    z.union([z.number(), z.string()]).describe("trackIndex"),
    z.array(z.any().describe("TrackEvent")),
  ),
  selectedTrackIndex: z.number(),
})

export type ArrangeEventsClipboardData = z.infer<
  typeof ArrangeEventsClipboardDataSchema
>
