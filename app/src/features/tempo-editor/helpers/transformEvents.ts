import type { TempoItem } from "@signal-app/tempo-editor"
import type { TempoGraphItem } from "../components/TempoGraphItem"
import type { TempoCoordTransform } from "../entities/TempoCoordTransform"

export const transformEvents = (
  tempoItems: readonly TempoItem[],
  transform: TempoCoordTransform,
  maxX: number,
): TempoGraphItem[] => {
  // まず位置だけ計算する
  // Calculate only position
  const items = tempoItems.map((item) => ({
    id: item.id,
    x: Math.round(transform.getX(item.tick)),
    y: Math.round(transform.getY(item.bpm)),
    bpm: item.bpm,
  }))

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
      bpm: e.bpm,
    }
  })
}
