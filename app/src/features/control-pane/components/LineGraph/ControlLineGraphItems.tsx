import { type Point, Rect } from "@signal-app/geometry"
import { useCallback, useMemo } from "react"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { usePianoRoll } from "../../../piano-roll/hooks/usePianoRoll"
import type { ControlCoordTransform } from "../../entities/ControlCoordTransform"
import { useDragSelectionGesture } from "../../gestures/useDragSelectionGesture"
import { useControlPane } from "../../hooks/useControlPane"
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
  const { selectedEventIds, setSelectedEventIds, controlPencilMode } =
    useControlPane()
  const { mouseMode } = usePianoRoll()
  const { scrollLeft } = useTickScroll()
  const dragSelectionGesture = useDragSelectionGesture()

  const controlPoints = useMemo(
    () =>
      items.map((p) => ({
        ...Rect.fromPointWithSize(p, circleRadius * 2),
        id: p.id,
      })),
    [items, circleRadius],
  )

  const getLocal = useCallback(
    (e: MouseEvent): Point => ({
      x: e.offsetX + scrollLeft,
      y: e.offsetY,
    }),
    [scrollLeft],
  )

  const handleMouseDownItem = useCallback(
    (e: MouseEvent, hitEventId: number) => {
      const isEditTool = mouseMode === "pencil" && controlPencilMode === "edit"
      if (mouseMode !== "selection" && !isEditTool) {
        return
      }
      e.stopPropagation()
      if (isEditTool && e.button === 2) {
        // right click only selects the vertex; the context menu opens on the canvas
        if (!selectedEventIds.includes(hitEventId)) {
          setSelectedEventIds([hitEventId])
        }
        return
      }
      const local = getLocal(e)
      dragSelectionGesture(e, hitEventId, local, controlTransform)
    },
    [
      mouseMode,
      controlPencilMode,
      selectedEventIds,
      setSelectedEventIds,
      dragSelectionGesture,
      getLocal,
      controlTransform,
    ],
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
