import { useTheme } from "@emotion/react"
import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { isEventInRange, Range } from "@signal-app/core"
import { Point } from "@signal-app/geometry"
import { MouseEventHandler, useCallback, useMemo } from "react"
import { Beats } from "../../../../components/GLNodes/Beats"
import { Cursor } from "../../../../components/GLNodes/Cursor"
import { matrixFromTranslation } from "../../../../helpers/matrix"
import { useBeats } from "../../../../hooks/useBeats"
import { useContextMenu } from "../../../../hooks/useContextMenu"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { usePianoRoll } from "../../../piano-roll/hooks/usePianoRoll"
import { ControlCoordTransform } from "../../entities/ControlCoordTransform"
import { useCreateSelectionGesture } from "../../gestures/useCreateSelectionGesture"
import { curveEasings, useCurveGesture } from "../../gestures/useCurveGesture"
import { usePencilGesture } from "../../gestures/usePencilGesture"
import { useControlPane } from "../../hooks/useControlPane"
import { useControlValueEvents } from "../../hooks/useControlValueEvents"
import { ControlSelectionContextMenu } from "../ControlSelectionContextMenu"
import { ControlLineGraphItems } from "./ControlLineGraphItems"
import { DragPreview } from "./DragPreview"
import { LineGraphSelection } from "./LineGraphSelection"

export interface LineGraphCanvasProps {
  width: number
  height: number
  maxValue: number
  lineWidth?: number
  circleRadius?: number
}

export const LineGraphCanvas = ({
  width,
  height,
  maxValue,
  lineWidth = 2,
  circleRadius = 4,
}: LineGraphCanvasProps) => {
  const events = useControlValueEvents()
  const { mouseMode } = usePianoRoll()
  const { controlPencilMode, controlCurveType } = useControlPane()
  const beats = useBeats()
  const theme = useTheme()
  const { cursorX, transform: tickTransform, scrollLeft } = useTickScroll()
  const effectiveCurveType =
    controlPencilMode === "line" ? "linear" : controlCurveType
  const handlePencilMouseDown = usePencilGesture()
  const { gesture: curveGesture, curveDragState } =
    useCurveGesture(effectiveCurveType)
  const createSelectionGesture = useCreateSelectionGesture()
  const { onContextMenu, menuProps } = useContextMenu()

  const cursor = useMemo(() => {
    if (mouseMode !== "pencil") {
      return "auto"
    }
    if (controlPencilMode === "line" || controlPencilMode === "curve") {
      return "crosshair"
    }
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
      handlePencilMouseDown(ev.nativeEvent, local, controlTransform)
    },
    [controlTransform, handlePencilMouseDown, getLocal],
  )

  const curveMouseDown: MouseEventHandler = useCallback(
    (ev) => {
      const local = getLocal(ev.nativeEvent)
      curveGesture(ev.nativeEvent, local, controlTransform)
    },
    [controlTransform, curveGesture, getLocal],
  )

  const selectionMouseDown: MouseEventHandler = useCallback(
    (ev) => {
      const local = getLocal(ev.nativeEvent)

      createSelectionGesture(ev.nativeEvent, local, controlTransform, (s) =>
        events
          .filter(isEventInRange(Range.create(s.fromTick, s.toTick)))
          .map((e) => e.id),
      )
    },
    [controlTransform, events, createSelectionGesture, getLocal],
  )

  const onMouseDown = useMemo(() => {
    if (mouseMode !== "pencil") {
      return selectionMouseDown
    }
    switch (controlPencilMode) {
      case "line":
      case "curve":
        return curveMouseDown
      default:
        return pencilMouseDown
    }
  }, [
    mouseMode,
    controlPencilMode,
    selectionMouseDown,
    curveMouseDown,
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
        {curveDragState !== null &&
          (controlPencilMode === "line" || controlPencilMode === "curve") && (
            <DragPreview
              start={curveDragState.start}
              end={curveDragState.end}
              scrollLeft={scrollLeft}
              width={width}
              height={height}
              color={theme.themeColor}
              easing={curveEasings[effectiveCurveType]}
            />
          )}
      </div>
      <ControlSelectionContextMenu {...menuProps} />
    </>
  )
}
