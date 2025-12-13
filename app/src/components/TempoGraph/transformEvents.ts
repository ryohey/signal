import type { TrackEventOf } from "@signal-app/core"
import type { SetTempoEvent } from "midifile-ts"
import type { TempoCoordTransform } from "../../entities/transform/TempoCoordTransform"
import type { TempoGraphItem } from "./TempoGraphItem"

export const transformEvents = (
  events: TrackEventOf<SetTempoEvent>[],
  transform: TempoCoordTransform,
  maxX: number
): TempoGraphItem[] => {
  // まず位置だけ計算する
  // Calculate only position
  const items = events
    .sort((a, b) => a.tick - b.tick)
    .map((e) => {
      const bpm = (60 * 1000000) / e.microsecondsPerBeat
      return {
        id: e.id,
        x: Math.round(transform.getX(e.tick)),
        y: Math.round(transform.getY(bpm)),
        microsecondsPerBeat: e.microsecondsPerBeat,
      }
    })

  // 次のイベント位置まで延びるように大きさを設定する
  // Set size to extend to the next event position
  return items.map((e, i) => {
    const nextX = i + 1 < items.length ? items[i + 1].x : maxX
    return {
      id: e.id,
      bounds: {
        x: e.x,
        y: e.y,
        width: nextX - e.x,
        height: transform.height - e.y + 1, // fit to screen bottom
      },
      microsecondsPerBeat: e.microsecondsPerBeat,
    }
  })
}
