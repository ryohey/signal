import { useCallback } from "react"
import { Point } from "../../../entities/geometry/Point"
import { Rect } from "../../../entities/geometry/Rect"
import { ControlCoordTransform } from "../../../entities/transform/ControlCoordTransform"
import { useControlPane } from "../../../hooks/useControlPane"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { useDragSelectionGesture } from "../Graph/MouseHandler/useDragSelectionGesture"
import { LineGraphItems } from "./LineGraphItems"

export const ControlLineGraphItems = ({
  items,
  zIndex,
  width,
  lineWidth,
  circleRadius,
  controlTransform,
}: {
  items: {
    x: number
    y: number
    id: number
  }[]
  zIndex: number
  width: number
  lineWidth: number
  circleRadius: number
  controlTransform: ControlCoordTransform
}) => {
  const { selectedEventIds, mouseMode } = useControlPane()
  const { scrollLeft } = useTickScroll()
  const dragSelectionGesture = useDragSelectionGesture()

  const controlPoints = items.map((p) => ({
    ...Rect.fromPointWithSize(p, circleRadius * 2),
    id: p.id,
  }))

  const getLocal = useCallback(
    (e: MouseEvent): Point => ({
      x: e.offsetX + scrollLeft,
      y: e.offsetY,
    }),
    [scrollLeft],
  )

  const handleMouseDownItem = useCallback(
    (e: MouseEvent, hitEventId: number) => {
      if (mouseMode !== "selection") {
        return
      }
      e.stopPropagation()
      const local = getLocal(e)
      dragSelectionGesture.onMouseDown(e, hitEventId, local, controlTransform)
    },
    [mouseMode, dragSelectionGesture, getLocal, controlTransform],
  )

  return (
    <LineGraphItems
      scrollLeft={scrollLeft}
      width={width}
      items={items}
      selectedEventIds={selectedEventIds}
      controlPoints={controlPoints}
      lineWidth={lineWidth}
      zIndex={zIndex}
      onMouseDownItem={handleMouseDownItem}
    />
  )
}
