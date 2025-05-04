import { useTheme } from "@emotion/react"
import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { FC, useCallback, useMemo } from "react"
import { matrixFromTranslation } from "../../../helpers/matrix"
import { useArrangeView } from "../../../hooks/useArrangeView"
import { AbstractMouseEvent } from "../../../hooks/useContextMenu"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { Beats } from "../../GLNodes/Beats"
import { Cursor } from "../../GLNodes/Cursor"
import { Selection } from "../../GLNodes/Selection"
import { Lines } from "./Lines"
import { Notes } from "./Notes"
import { useDragScrollGesture } from "./gestures/useDragScrollGesture"
import { useSelectionGesture } from "./gestures/useSelectionGesture"

export interface ArrangeViewCanvasProps {
  width: number
  onContextMenu: (e: AbstractMouseEvent) => void
}

export const ArrangeViewCanvas: FC<ArrangeViewCanvasProps> = ({
  width,
  onContextMenu,
}) => {
  const {
    scrollTop,
    contentHeight: height,
    rulerStore: { beats },
    cursorX,
    selectionRect,
  } = useArrangeView()
  const { scrollLeft } = useTickScroll()
  const theme = useTheme()

  const selectionGesture = useSelectionGesture()
  const dragScrollGesture = useDragScrollGesture()

  const scrollXMatrix = useMemo(
    () => matrixFromTranslation(-scrollLeft, 0),
    [scrollLeft],
  )

  const scrollYMatrix = useMemo(
    () => matrixFromTranslation(0, -scrollTop),
    [scrollTop],
  )

  const scrollXYMatrix = useMemo(
    () => matrixFromTranslation(-scrollLeft, -scrollTop),
    [scrollLeft, scrollTop],
  )

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      switch (e.button) {
        case 0:
          selectionGesture.onMouseDown(e)
          break
        case 1:
          dragScrollGesture.onMouseDown(e)
          break
        case 2:
          onContextMenu(e)
          break
        default:
          break
      }
    },
    [selectionGesture, dragScrollGesture, onContextMenu],
  )

  return (
    <GLCanvas
      width={width}
      height={height}
      onMouseDown={onMouseDown}
      onContextMenu={useCallback((e: any) => e.preventDefault(), [])}
      style={{ backgroundColor: theme.editorBackgroundColor }}
    >
      <Transform matrix={scrollYMatrix}>
        <Lines width={width} zIndex={0} />
      </Transform>
      <Transform matrix={scrollXMatrix}>
        <Beats height={height} beats={beats} zIndex={1} />
        <Cursor x={cursorX} height={height} zIndex={4} />
      </Transform>
      <Transform matrix={scrollXYMatrix}>
        <Notes zIndex={2} />
        <Selection rect={selectionRect} zIndex={3} />
      </Transform>
    </GLCanvas>
  )
}
