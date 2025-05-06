import { useCallback, useMemo } from "react"
import { transformEvents } from "../components/TempoGraph/transformEvents"
import { Point } from "../entities/geometry/Point"
import { Rect } from "../entities/geometry/Rect"
import { useConductorTrack } from "./useConductorTrack"
import { useStores } from "./useStores"
import { useTempoEditor } from "./useTempoEditor"
import { useTickScroll } from "./useTickScroll"

const CIRCLE_RADIUS = 4

export function useTempoItems() {
  const {
    tempoEditorStore: { tickScrollStore },
  } = useStores()
  const { transform } = useTempoEditor()
  const { tempoEvents } = useConductorTrack()
  const { canvasWidth, scrollLeft } = useTickScroll(tickScrollStore)
  const items = useMemo(
    () => transformEvents(tempoEvents, transform, canvasWidth + scrollLeft),
    [tempoEvents, transform, canvasWidth, scrollLeft],
  )

  // draggable hit areas for each tempo changes
  const controlPoints = useMemo(
    () =>
      items.map((p) => ({
        ...Rect.fromPointWithSize(p.bounds, CIRCLE_RADIUS * 2),
        id: p.id,
      })),
    [items],
  )

  return {
    items,
    controlPoints,
    hitTest: useCallback(
      (point: Point) => {
        return controlPoints.find((r) => Rect.containsPoint(r, point))?.id
      },
      [controlPoints],
    ),
  }
}
