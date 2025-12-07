import { HitArea } from "@ryohey/webgl-react"
import { bpmToUSecPerBeat, uSecPerBeatToBPM } from "@signal-app/core"
import { type FC, useCallback, useMemo } from "react"
import { useChangeTempo } from "../../../actions"
import { Rect } from "../../../entities/geometry/Rect"
import { useTempoEditor } from "../../../hooks/useTempoEditor"
import { useTempoItems } from "../../../hooks/useTempoItems"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { LineGraphItems } from "../../ControlPane/LineGraph/LineGraphItems"
import { useDragSelectionGesture } from "../MouseHandler/useDragSelectionGesture"
import type { TempoGraphItem } from "../TempoGraphItem"

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
  const changeTempo = useChangeTempo()

  // draggable hit areas for each tempo changes
  const controlPoints = useMemo(
    () =>
      items.map((p) => ({
        ...Rect.fromPointWithSize(p.bounds, CIRCLE_RADIUS * 2),
        id: p.id,
        original: p,
      })),
    [items]
  )

  const handleMouseDownItem = useCallback(
    (e: MouseEvent, itemId: number) => {
      if (mouseMode !== "selection") {
        return
      }
      e.stopPropagation()
      dragSelectionGesture.onMouseDown(e, itemId)
    },
    [mouseMode, dragSelectionGesture]
  )

  const handleWheelItem = useCallback(
    (e: WheelEvent, item: TempoGraphItem) => {
      const event = items.filter((ev) => ev.id === item.id)[0]
      const movement = e.deltaY > 0 ? -1 : 1
      const bpm = uSecPerBeatToBPM(event.microsecondsPerBeat)
      changeTempo(event.id, Math.floor(bpmToUSecPerBeat(bpm + movement)))
    },
    [items, changeTempo]
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
    [onWheel, item]
  )
  const hitBounds = useMemo(
    () => ({
      x: bounds.x,
      y: 0,
      width: bounds.width,
      height: Number.MAX_SAFE_INTEGER, // full height
    }),
    [bounds.x, bounds.width]
  )
  return <HitArea bounds={hitBounds} zIndex={zIndex} onWheel={handleWheel} />
}
