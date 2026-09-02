import { Rect } from "@signal-app/geometry"

export interface TempoGraphItem {
  id: number
  bounds: Rect
  bpm: number
}
