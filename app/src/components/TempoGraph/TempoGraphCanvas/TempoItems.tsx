import { HitArea } from "@ryohey/webgl-react"
import { FC, useCallback, useMemo } from "react"
import { Rect } from "../../../entities/geometry/Rect"
import { useTempoEditor } from "../../../hooks/useTempoEditor"
import { useTempoItems } from "../../../hooks/useTempoItems"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { LineGraphItems } from "../../ControlPane/LineGraph/LineGraphItems"
import { useDragSelectionGesture } from "../MouseHandler/useDragSelectionGesture"

const CIRCLE_RADIUS = 4

export interface TempoItemsProps {
  width: number
  zIndex: number
}

export const TempoItems: FC<TempoItemsProps> = ({ width, zIndex }) => {
  const { mouseMode, selectedEventIds } = useTempoEditor()
  const { items } = useTempoItems()
  const { scrollLeft } = useTickScroll()
  const dragSelectionGesture = useDragSelectionGesture()

  // draggable hit areas for each tempo changes
  const controlPoints = useMemo(
    () =>
      items.map((p) => ({
        ...Rect.fromPointWithSize(p.bounds, CIRCLE_RADIUS * 2),
        id: p.id,
        original: p,
      })),
    [items],
  )

  const handleMouseDownItem = useCallback(
    (e: MouseEvent, itemId: number) => {
      if (mouseMode !== "selection") {
        return
      }
      e.stopPropagation()
      dragSelectionGesture.onMouseDown(e, itemId)
    },
    [mouseMode, dragSelectionGesture],
  )

  return (
    <>
      <LineGraphItems
        width={width}
        items={items.map((i) => ({ ...i.bounds, id: i.id }))}
        selectedEventIds={selectedEventIds}
        controlPoints={controlPoints}
        scrollLeft={scrollLeft}
        lineWidth={2}
        zIndex={zIndex}
      />
      {controlPoints.map((item) => (
        <TempoItemHitArea
          key={item.id}
          bounds={item}
          itemId={item.id}
          zIndex={zIndex}
          onMouseDown={handleMouseDownItem}
        />
      ))}
    </>
  )
}

const TempoItemHitArea: FC<{
  bounds: Rect
  itemId: number
  zIndex: number
  onMouseDown: (e: MouseEvent, itemId: number) => void
}> = ({ bounds, itemId, zIndex, onMouseDown }) => {
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      onMouseDown(e, itemId)
    },
    [onMouseDown, itemId],
  )
  return (
    <HitArea bounds={bounds} zIndex={zIndex} onMouseDown={handleMouseDown} />
  )
}
