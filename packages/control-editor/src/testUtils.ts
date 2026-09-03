import { Track } from "@signal-app/core"
import { ValueEventType } from "./entities/ValueEventType"
import { TrackControlEditor } from "./TrackControlEditor"

export const createTrackControlEditor = (
  type: ValueEventType = { type: "controller", controllerType: 11 },
): TrackControlEditor => {
  const track = new Track()
  return new TrackControlEditor(track, type)
}
