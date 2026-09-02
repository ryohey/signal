import { HitArea } from "@ryohey/webgl-react"
import { Rect } from "@signal-app/geometry"
import { FC, useCallback, useMemo } from "react"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { LineGraphItems } from "../../../control-pane/components/LineGraph/LineGraphItems"
import { transformEvents } from "../../helpers/transformEvents"
import { useChangeTempo } from "../../hooks/useChangeTempo"
import { useDragSelectionGesture } from "../../hooks/useDragSelectionGesture"
import { useTempoEditor } from "../../hooks/useTempoEditor"
import { useTempoItems } from "../../hooks/useTempoItems"
import { useTempoTransform } from "../../hooks/useTempoTransform"
import { TempoGraphItem } from "../TempoGraphItem"

const CIRCLE_RADIUS = 4

export interface TempoItemsProps {
  width: number
  zIndex: number
}

export const TempoItems: FC<TempoItemsProps> = ({ width, zIndex }) => {
  const { mouseMode, selectedEventIds } = useTempoEditor()
  const tempoItems = useTempoItems()
  const { transform } = useTempoTransform()
  const { scrollLeft, contentWidth } = useTickScroll()
  const dragSelectionGesture = useDragSelectionGesture()
  const changeTempo = useChangeTempo()

  const items = useMemo(
    () => transformEvents(tempoItems, transform, contentWidth),
    [tempoItems, transform, contentWidth],
  )

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
      dragSelectionGesture(e, itemId)
    },
    [mouseMode, dragSelectionGesture],
  )

  const handleWheelItem = useCallback(
    (e: WheelEvent, item: TempoGraphItem) => {
      const event = items.filter((ev) => ev.id === item.id)[0]
      const movement = e.deltaY > 0 ? -1 : 1
      changeTempo(event.id, Math.max(1, Math.floor(event.bpm + movement)))
    },
    [items, changeTempo],
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
        onMouseDownItem={handleMouseDownItem}
      />
      {/* Wheel hit area */}
      {items.map((item) => (
        <TempoItemWheelArea
          key={item.id}
          bounds={item.bounds}
          item={item}
          zIndex={zIndex}
          onWheel={handleWheelItem}
        />
      ))}
    </>
  )
}

const TempoItemWheelArea: FC<{
  bounds: Rect
  item: TempoGraphItem
  zIndex: number
  onWheel: (e: WheelEvent, item: TempoGraphItem) => void
}> = ({ bounds, item, zIndex, onWheel }) => {
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      onWheel(e, item)
    },
    [onWheel, item],
  )
  const hitBounds = useMemo(
    () => ({
      x: bounds.x,
      y: 0,
      width: bounds.width,
      height: Number.MAX_SAFE_INTEGER, // full height
    }),
    [bounds.x, bounds.width],
  )
  return <HitArea bounds={hitBounds} zIndex={zIndex} onWheel={handleWheel} />
}
