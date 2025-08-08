import { useTheme } from "@emotion/react"
import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import React, { MouseEventHandler, useCallback, useMemo } from "react"
import { useCreateOrUpdateControlEventsValue } from "../../../actions/control"
import { ValueEventType } from "../../../entities/event/ValueEventType"
import { Point } from "../../../entities/geometry/Point"
import { Range } from "../../../entities/geometry/Range"
import { Rect } from "../../../entities/geometry/Rect"
import { ControlCoordTransform } from "../../../entities/transform/ControlCoordTransform"
import { isEventInRange } from "../../../helpers/filterEvents"
import { useContextMenu } from "../../../hooks/useContextMenu"
import { useControlPane } from "../../../hooks/useControlPane"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { TrackEventOf } from "../../../track"
import { ControlSelectionContextMenu } from "../ControlSelectionContextMenu"
import { useCreateSelectionGesture } from "../Graph/MouseHandler/useCreateSelectionGesture"
import { useDragSelectionGesture } from "../Graph/MouseHandler/useDragSelectionGesture"
import { usePencilGesture } from "../Graph/MouseHandler/usePencilGesture"
import { GraphAxis } from "./GraphAxis"
import { LineGraphCanvas } from "./LineGraphCanvas"

export interface ItemValue {
  tick: number
  value: number
}

export interface LineGraphProps<T extends ControllerEvent | PitchBendEvent> {
  width: number
  height: number
  maxValue: number
  events: TrackEventOf<T>[]
  eventType: ValueEventType
  lineWidth?: number
  circleRadius?: number
  axis: number[]
  axisWidth: number
  axisLabelFormatter?: (value: number) => string
}

const LineGraph = <T extends ControllerEvent | PitchBendEvent>({
  maxValue,
  events,
  eventType,
  width,
  height,
  lineWidth = 2,
  circleRadius = 4,
  axis,
  axisWidth,
  axisLabelFormatter = (v) => v.toString(),
}: LineGraphProps<T>) => {
  const { cursor, mouseMode } = useControlPane()
  const { transform, scrollLeft } = useTickScroll()
  const theme = useTheme()
  const createOrUpdateControlEventsValue = useCreateOrUpdateControlEventsValue()
  const handlePencilMouseDown = usePencilGesture(eventType)
  const dragSelectionGesture = useDragSelectionGesture()
  const createSelectionGesture = useCreateSelectionGesture()

  const controlTransform = useMemo(
    () => new ControlCoordTransform(transform, maxValue, height, lineWidth),
    [transform, maxValue, height, lineWidth],
  )

  const items = events.map((e) => ({
    id: e.id,
    ...controlTransform.toPosition(e.tick, e.value),
  }))

  const controlPoints = items.map((p) => ({
    ...Rect.fromPointWithSize(p, circleRadius * 2),
    id: p.id,
  }))

  const hitTest = useCallback(
    (point: Point) =>
      controlPoints.find((r) => Rect.containsPoint(r, point))?.id,
    [controlPoints],
  )

  const getLocal = useCallback(
    (e: MouseEvent): Point => ({
      x: e.offsetX + scrollLeft,
      y: e.offsetY,
    }),
    [scrollLeft],
  )

  const pencilMouseDown: MouseEventHandler = useCallback(
    (ev) => {
      const local = getLocal(ev.nativeEvent)

      handlePencilMouseDown.onMouseDown(ev.nativeEvent, local, controlTransform)
    },
    [controlTransform, handlePencilMouseDown, getLocal],
  )

  const selectionMouseDown: MouseEventHandler = useCallback(
    (ev) => {
      const local = getLocal(ev.nativeEvent)
      const hitEventId = hitTest(local)

      if (hitEventId !== undefined) {
        dragSelectionGesture.onMouseDown(
          ev.nativeEvent,
          hitEventId,
          local,
          controlTransform,
        )
      } else {
        createSelectionGesture.onMouseDown(
          ev.nativeEvent,
          local,
          controlTransform,
          (s) =>
            events
              .filter(isEventInRange(Range.create(s.fromTick, s.toTick)))
              .map((e) => e.id),
        )
      }
    },
    [
      controlTransform,
      events,
      hitTest,
      dragSelectionGesture,
      createSelectionGesture,
      getLocal,
    ],
  )

  const onMouseDown =
    mouseMode === "pencil" ? pencilMouseDown : selectionMouseDown

  const onClickAxis = useCallback(
    (value: number) => {
      const event = ValueEventType.getEventFactory(eventType)(value)
      createOrUpdateControlEventsValue(event)
    },
    [eventType, createOrUpdateControlEventsValue],
  )

  const { onContextMenu, menuProps } = useContextMenu()

  return (
    <div
      style={{
        display: "flex",
      }}
    >
      <GraphAxis
        width={axisWidth}
        values={axis}
        valueFormatter={axisLabelFormatter}
        onClick={onClickAxis}
      />
      <LineGraphCanvas
        style={{ cursor, backgroundColor: theme.editorBackgroundColor }}
        onMouseDown={onMouseDown}
        onContextMenu={onContextMenu}
        width={width}
        height={height}
        maxValue={maxValue}
        controlPoints={controlPoints}
        items={items}
      />
      <ControlSelectionContextMenu {...menuProps} />
    </div>
  )
}

export default React.memo(LineGraph)
