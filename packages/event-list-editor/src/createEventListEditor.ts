import type { Track } from "@signal-app/core"
import { TrackEventListEditor } from "./TrackEventListEditor"

export const createEventListEditor = (track: Track) =>
  new TrackEventListEditor(track)
