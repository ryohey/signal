import { useTheme } from "@emotion/react"
import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { isEventInRange, Range, TrackEventOf } from "@signal-app/core"
import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import { MouseEventHandler, useCallback, useMemo } from "react"
import { ValueEventType } from "../../../entities/event/ValueEventType"
import { Point } from "../../../entities/geometry/Point"
import { ControlCoordTransform } from "../../../entities/transform/ControlCoordTransform"
import { matrixFromTranslation } from "../../../helpers/matrix"
import { useBeats } from "../../../hooks/useBeats"
import { useContextMenu } from "../../../hooks/useContextMenu"
import { useControlPane } from "../../../hooks/useControlPane"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { Beats } from "../../GLNodes/Beats"
import { Cursor } from "../../GLNodes/Cursor"
import { ControlSelectionContextMenu } from "../ControlSelectionContextMenu"
import { useCreateSelectionGesture } from "../Graph/MouseHandler/useCreateSelectionGesture"
import { useLineGesture } from "../Graph/MouseHandler/useLineGesture"
import { usePencilGesture } from "../Graph/MouseHandler/usePencilGesture"
import { useSingleGesture } from "../Graph/MouseHandler/useSingleGesture"
import { ControlLineGraphItems } from "./ControlLineGraphItems"
import { LineGraphSelection } from "./LineGraphSelection"

export interface LineGraphCanvasProps<
  T extends ControllerEvent | PitchBendEvent,
> {
  width: number
  height: number
  maxValue: number
  events: TrackEventOf<T>[]
  eventType: ValueEventType
  lineWidth?: number
  circleRadius?: number
}

export const LineGraphCanvas = <T extends ControllerEvent | PitchBendEvent>({
  width,
  height,
  maxValue,
  eventType,
  events,
  lineWidth = 2,
  circleRadius = 4,
}: LineGraphCanvasProps<T>) => {
  const { mouseMode } = usePianoRoll()
  const { controlPencilMode } = useControlPane()
  const beats = useBeats()
  const theme = useTheme()
  const { cursorX, transform: tickTransform, scrollLeft } = useTickScroll()
  const handlePencilMouseDown = usePencilGesture(eventType)
  const handleSingleMouseDown = useSingleGesture(eventType)
  const { gesture: lineGesture, lineDragState } = useLineGesture(eventType)
  const createSelectionGesture = useCreateSelectionGesture()
  const { onContextMenu, menuProps } = useContextMenu()

  const cursor = useMemo(() => {
    if (mouseMode !== "pencil") return "auto"
    if (controlPencilMode === "line") return "crosshair"
    return `url("./cursor-pencil.svg") 0 20, pointer`
  }, [mouseMode, controlPencilMode])

  const controlTransform = useMemo(
    () => new ControlCoordTransform(tickTransform, maxValue, height, lineWidth),
    [tickTransform, maxValue, height, lineWidth],
  )

  const items = events.map((e) => ({
    id: e.id,
    ...controlTransform.toPosition(e.tick, e.value),
  }))

  const scrollXMatrix = useMemo(
    () => matrixFromTranslation(-Math.floor(scrollLeft), 0),
    [scrollLeft],
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

  const singleMouseDown: MouseEventHandler = useCallback(
    (ev) => {
      const local = getLocal(ev.nativeEvent)
      handleSingleMouseDown.onMouseDown(ev.nativeEvent, local, controlTransform)
    },
    [controlTransform, handleSingleMouseDown, getLocal],
  )

  const lineMouseDown: MouseEventHandler = useCallback(
    (ev) => {
      const local = getLocal(ev.nativeEvent)
      lineGesture.onMouseDown(ev.nativeEvent, local, controlTransform)
    },
    [controlTransform, lineGesture, getLocal],
  )

  const selectionMouseDown: MouseEventHandler = useCallback(
    (ev) => {
      const local = getLocal(ev.nativeEvent)

      createSelectionGesture.onMouseDown(
        ev.nativeEvent,
        local,
        controlTransform,
        (s) =>
          events
            .filter(isEventInRange(Range.create(s.fromTick, s.toTick)))
            .map((e) => e.id),
      )
    },
    [controlTransform, events, createSelectionGesture, getLocal],
  )

  const onMouseDown = useMemo(() => {
    if (mouseMode !== "pencil") return selectionMouseDown
    switch (controlPencilMode) {
      case "single":
        return singleMouseDown
      case "line":
        return lineMouseDown
      default:
        return pencilMouseDown
    }
  }, [
    mouseMode,
    controlPencilMode,
    selectionMouseDown,
    singleMouseDown,
    lineMouseDown,
    pencilMouseDown,
  ])

  const style = useMemo(
    () => ({ backgroundColor: theme.editorBackgroundColor }),
    [theme],
  )

  return (
    <>
      <div style={{ position: "relative" }}>
        <GLCanvas
          width={width}
          height={height}
          onMouseDown={onMouseDown}
          onContextMenu={onContextMenu}
          style={style}
          cursor={cursor}
        >
          <Transform matrix={scrollXMatrix}>
            <Beats height={height} beats={beats} zIndex={0} />
            <ControlLineGraphItems
              width={width}
              items={items}
              lineWidth={lineWidth}
              circleRadius={circleRadius}
              zIndex={1}
              controlTransform={controlTransform}
            />
            <LineGraphSelection zIndex={2} transform={controlTransform} />
            <Cursor x={cursorX} height={height} zIndex={3} />
          </Transform>
        </GLCanvas>
        {lineDragState !== null && controlPencilMode === "line" && (
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
            width={width}
            height={height}
            aria-hidden="true"
          >
            <line
              x1={lineDragState.start.x - scrollLeft}
              y1={lineDragState.start.y}
              x2={lineDragState.end.x - scrollLeft}
              y2={lineDragState.end.y}
              stroke={theme.themeColor}
              strokeWidth={2}
              strokeDasharray="6 3"
            />
            <circle
              cx={lineDragState.start.x - scrollLeft}
              cy={lineDragState.start.y}
              r={4}
              fill={theme.themeColor}
            />
            <circle
              cx={lineDragState.end.x - scrollLeft}
              cy={lineDragState.end.y}
              r={4}
              fill={theme.themeColor}
            />
          </svg>
        )}
      </div>
      <ControlSelectionContextMenu {...menuProps} />
    </>
  )
}
