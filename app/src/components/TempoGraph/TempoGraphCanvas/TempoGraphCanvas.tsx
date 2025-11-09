import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { CSSProperties, FC, useCallback, useMemo } from "react"
import { useChangeTempo } from "../../../actions"
import { Point } from "../../../entities/geometry/Point"
import { bpmToUSecPerBeat, uSecPerBeatToBPM } from "../../../helpers/bpm"
import { matrixFromTranslation } from "../../../helpers/matrix"
import { useRuler } from "../../../hooks/useRuler"
import { useTempoEditor } from "../../../hooks/useTempoEditor"
import { useTempoItems } from "../../../hooks/useTempoItems"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { Beats } from "../../GLNodes/Beats"
import { Cursor } from "../../GLNodes/Cursor"
import { Selection } from "../../GLNodes/Selection"
import { useCreateSelectionGesture } from "../MouseHandler/useCreateSelectionGesture"
import { usePencilGesture } from "../MouseHandler/usePencilGesture"
import { Lines } from "./Lines"
import { TempoItems } from "./TempoItems"

export interface TempoGraphCanvasProps {
  width: number
  height: number
  style?: CSSProperties
  className?: string
}

export const TempoGraphCanvas: FC<TempoGraphCanvasProps> = ({
  width,
  height,
  style,
  className,
}) => {
  const { selectionRect, transform, mouseMode, cursor } = useTempoEditor()
  const { beats } = useRuler()
  const { items } = useTempoItems()
  const { cursorX, scrollLeft: _scrollLeft } = useTickScroll()
  const changeTempo = useChangeTempo()
  const pencilGesture = usePencilGesture()
  const createSelectionGesture = useCreateSelectionGesture()

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

  const currentGesture =
    mouseMode === "pencil" ? pencilGesture : createSelectionGesture

  const onMouseDownGraph = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) {
        return
      }

      const local = getLocal(e.nativeEvent)
      currentGesture.onMouseDown(e.nativeEvent, local, transform)
    },
    [currentGesture, transform, getLocal],
  )

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
    [items, changeTempo, findEvent, getLocal],
  )

  const scrollXMatrix = useMemo(
    () => matrixFromTranslation(-scrollLeft, 0),
    [scrollLeft],
  )

  const computedStyle = useMemo(
    () => ({
      ...style,
      cursor,
    }),
    [style, cursor],
  )

  return (
    <GLCanvas
      width={width}
      height={height}
      onMouseDown={onMouseDownGraph}
      onWheel={onWheelGraph}
      style={computedStyle}
      className={className}
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
