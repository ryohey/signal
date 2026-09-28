import type { Track } from "@signal-app/core"
import { type MeasureProvider, SongRulerEditor } from "./SongRulerEditor"

export const createRulerEditor = (
  song: MeasureProvider,
  conductorTrack: Track,
) => new SongRulerEditor(song, conductorTrack)
export type RulerEditor = ReturnType<typeof createRulerEditor>
