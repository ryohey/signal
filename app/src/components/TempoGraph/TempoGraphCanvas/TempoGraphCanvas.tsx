import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { CSSProperties, FC, useCallback, useMemo } from "react"
import { matrixFromTranslation } from "../../../helpers/matrix"
import { useBeats } from "../../../hooks/useBeats"
import { useTempoEditor } from "../../../hooks/useTempoEditor"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { Beats } from "../../GLNodes/Beats"
import { Cursor } from "../../GLNodes/Cursor"
import { useCreateSelectionGesture } from "../MouseHandler/useCreateSelectionGesture"
import { usePencilGesture } from "../MouseHandler/usePencilGesture"
import { Lines } from "./Lines"
import { TempoGraphSelection } from "./TempoGraphSelection"
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
  const { transform, mouseMode } = useTempoEditor()
  const beats = useBeats()
  const { cursorX, scrollLeft: _scrollLeft } = useTickScroll()
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

  const scrollXMatrix = useMemo(
    () => matrixFromTranslation(-scrollLeft, 0),
    [scrollLeft],
  )

  const cursor = useMemo(
    () =>
      mouseMode === "pencil"
        ? `url("./cursor-pencil.svg") 0 20, pointer`
        : "auto",
    [mouseMode],
  )

  return (
    <GLCanvas
      width={width}
      height={height}
      onMouseDown={onMouseDownGraph}
      style={style}
      className={className}
      cursor={cursor}
    >
      <Lines width={width} zIndex={0} />
      <Transform matrix={scrollXMatrix}>
        <Beats height={height} beats={beats} zIndex={1} />
        <TempoItems width={width} zIndex={2} />
        <TempoGraphSelection zIndex={3} />
        <Cursor x={cursorX} height={height} zIndex={4} />
      </Transform>
    </GLCanvas>
  )
}
