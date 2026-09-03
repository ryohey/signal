import { Track } from "@signal-app/core"
import { TrackVelocityEditor } from "./TrackVelocityEditor"

export const createVelocityEditor = (track: Track) =>
  new TrackVelocityEditor(track)
