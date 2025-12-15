import { Rect } from "../../entities/geometry/Rect"

export interface TempoGraphItem {
  id: number
  bounds: Rect
  microsecondsPerBeat: number
}
