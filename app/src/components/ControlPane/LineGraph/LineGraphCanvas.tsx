import { useTheme } from "@emotion/react"
import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { ControllerEvent, PitchBendEvent } from "midifile-ts"
import { MouseEventHandler, useCallback, useMemo } from "react"
import { ValueEventType } from "../../../entities/event/ValueEventType"
import { Point } from "../../../entities/geometry/Point"
import { Range } from "../../../entities/geometry/Range"
import { ControlCoordTransform } from "../../../entities/transform/ControlCoordTransform"
import { isEventInRange } from "../../../helpers/filterEvents"
import { matrixFromTranslation } from "../../../helpers/matrix"
import { useContextMenu } from "../../../hooks/useContextMenu"
import { useControlPane } from "../../../hooks/useControlPane"
import { useRuler } from "../../../hooks/useRuler"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { TrackEventOf } from "../../../track"
import { Beats } from "../../GLNodes/Beats"
import { Cursor } from "../../GLNodes/Cursor"
import { ControlSelectionContextMenu } from "../ControlSelectionContextMenu"
import { useCreateSelectionGesture } from "../Graph/MouseHandler/useCreateSelectionGesture"
import { usePencilGesture } from "../Graph/MouseHandler/usePencilGesture"
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
  const { cursor, mouseMode } = useControlPane()
  const { beats } = useRuler()
  const theme = useTheme()
  const { cursorX, transform: tickTransform, scrollLeft } = useTickScroll()
  const handlePencilMouseDown = usePencilGesture(eventType)
  const createSelectionGesture = useCreateSelectionGesture()
  const { onContextMenu, menuProps } = useContextMenu()

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

  const onMouseDown =
    mouseMode === "pencil" ? pencilMouseDown : selectionMouseDown

  const style = useMemo(
    () => ({ cursor, backgroundColor: theme.editorBackgroundColor }),
    [cursor, theme],
  )

  return (
    <>
      <GLCanvas
        width={width}
        height={height}
        onMouseDown={onMouseDown}
        onContextMenu={onContextMenu}
        style={style}
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
      <ControlSelectionContextMenu {...menuProps} />
    </>
  )
}
