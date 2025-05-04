import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { CSSProperties, FC, useCallback, useMemo } from "react"
import { useChangeTempo } from "../../../actions"
import { Point } from "../../../entities/geometry/Point"
import { bpmToUSecPerBeat, uSecPerBeatToBPM } from "../../../helpers/bpm"
import { matrixFromTranslation } from "../../../helpers/matrix"
import { useTempoEditor } from "../../../hooks/useTempoEditor"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { Beats } from "../../GLNodes/Beats"
import { Cursor } from "../../GLNodes/Cursor"
import { Selection } from "../../GLNodes/Selection"
import { useCreateSelectionGesture } from "../MouseHandler/useCreateSelectionGesture"
import { useDragSelectionGesture } from "../MouseHandler/useDragSelectionGesture"
import { usePencilGesture } from "../MouseHandler/usePencilGesture"
import { Lines } from "./Lines"
import { TempoItems } from "./TempoItems"

export interface TempoGraphCanvasProps {
  width: number
  height: number
  style?: CSSProperties
}

export const TempoGraphCanvas: FC<TempoGraphCanvasProps> = ({
  width,
  height,
  style,
}) => {
  const {
    selectionRect,
    hitTest,
    items,
    transform,
    mouseMode,
    beats,
    cursor,
    cursorX,
  } = useTempoEditor()
  const { scrollLeft: _scrollLeft } = useTickScroll()
  const changeTempo = useChangeTempo()
  const pencilGesture = usePencilGesture()
  const createSelectionGesture = useCreateSelectionGesture()
  const dragSelectionGesture = useDragSelectionGesture()

  const scrollLeft = Math.floor(_scrollLeft)

  const getLocal = useCallback(
    (e: MouseEvent) => ({
      x: e.offsetX + scrollLeft,
      y: e.offsetY,
    }),
    [scrollLeft],
  )

  const findEvent = useCallback(
    (local: Point) =>
      items.find(
        (n) => local.x >= n.bounds.x && local.x < n.bounds.x + n.bounds.width,
      ),
    [items],
  )

  const pencilMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) {
        return
      }

      pencilGesture.onMouseDown(
        e.nativeEvent,
        getLocal(e.nativeEvent),
        transform,
      )
    },
    [pencilGesture, transform, scrollLeft, mouseMode],
  )

  const selectionMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) {
        return
      }

      const local = getLocal(e.nativeEvent)
      const hitEventId = hitTest(local)

      if (hitEventId !== undefined) {
        dragSelectionGesture.onMouseDown(
          e.nativeEvent,
          hitEventId,
          local,
          transform,
        )
      } else {
        createSelectionGesture.onMouseDown(e.nativeEvent, local, transform)
      }
    },
    [dragSelectionGesture, createSelectionGesture, transform, scrollLeft],
  )

  const onMouseDownGraph =
    mouseMode === "pencil" ? pencilMouseDown : selectionMouseDown

  const onWheelGraph = useCallback(
    (e: React.WheelEvent) => {
      const local = getLocal(e.nativeEvent)
      const item = findEvent(local)
      if (!item) {
        return
      }
      const event = items.filter((ev) => ev.id === item.id)[0]
      const movement = e.nativeEvent.deltaY > 0 ? -1 : 1
      const bpm = uSecPerBeatToBPM(event.microsecondsPerBeat)
      changeTempo(event.id, Math.floor(bpmToUSecPerBeat(bpm + movement)))
    },
    [items, scrollLeft, changeTempo],
  )

  const scrollXMatrix = useMemo(
    () => matrixFromTranslation(-scrollLeft, 0),
    [scrollLeft],
  )

  return (
    <GLCanvas
      width={width}
      height={height}
      onMouseDown={onMouseDownGraph}
      onWheel={onWheelGraph}
      style={{ ...style, cursor }}
    >
      <Lines width={width} zIndex={0} />
      <Transform matrix={scrollXMatrix}>
        <Beats height={height} beats={beats} zIndex={1} />
        <TempoItems width={width} zIndex={2} />
        <Selection rect={selectionRect} zIndex={3} />
        <Cursor x={cursorX} height={height} zIndex={4} />
      </Transform>
    </GLCanvas>
  )
}
