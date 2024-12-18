import { useTheme } from "@emotion/react"
import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { observer } from "mobx-react-lite"
import { FC, useCallback, useMemo } from "react"
import {
  arrangeEndSelection,
  arrangeMoveSelection,
  arrangeResizeSelection,
} from "../../../actions"
import { pushHistory } from "../../../actions/history"
import { Point } from "../../../entities/geometry/Point"
import { Rect } from "../../../entities/geometry/Rect"
import { matrixFromTranslation } from "../../../helpers/matrix"
import { getClientPos } from "../../../helpers/mouseEvent"
import { observeDrag } from "../../../helpers/observeDrag"
import { AbstractMouseEvent } from "../../../hooks/useContextMenu"
import { useStores } from "../../../hooks/useStores"
import { Beats } from "../../GLNodes/Beats"
import { Cursor } from "../../GLNodes/Cursor"
import { Selection } from "../../GLNodes/Selection"
import { Lines } from "./Lines"
import { Notes } from "./Notes"

export interface ArrangeViewCanvasProps {
  width: number
  onContextMenu: (e: AbstractMouseEvent) => void
}

export const ArrangeViewCanvas: FC<ArrangeViewCanvasProps> = observer(
  ({ width, onContextMenu }) => {
    const rootStore = useStores()
    const { arrangeViewStore, player } = rootStore
    const theme = useTheme()
    const {
      scrollLeft,
      scrollTop,
      contentHeight: height,
      rulerStore: { beats },
      cursorX,
      selection,
      selectionRect,
      trackTransform,
    } = arrangeViewStore
    const scrollXMatrix = useMemo(
      () => matrixFromTranslation(-scrollLeft, 0),
      [scrollLeft],
    )

    const scrollYMatrix = useMemo(
      () => matrixFromTranslation(0, -scrollTop),
      [scrollLeft, scrollTop],
    )

    const scrollXYMatrix = useMemo(
      () => matrixFromTranslation(-scrollLeft, -scrollTop),
      [scrollLeft, scrollTop],
    )

    const setScrollLeft = useCallback((v: number) => {
      arrangeViewStore.setScrollLeftInPixels(v)
      arrangeViewStore.autoScroll = false
    }, [])
    const setScrollTop = useCallback(
      (v: number) => arrangeViewStore.setScrollTop(v),
      [],
    )

    const handleLeftClick = useCallback(
      (e: React.MouseEvent) => {
        const startPosPx: Point = {
          x: e.nativeEvent.offsetX + scrollLeft,
          y: e.nativeEvent.offsetY + scrollTop,
        }
        const startClientPos = getClientPos(e.nativeEvent)

        const isSelectionSelected =
          selectionRect != null && Rect.containsPoint(selectionRect, startPosPx)

        if (isSelectionSelected) {
          let isMoved = false
          observeDrag({
            onMouseMove: (e) => {
              const deltaPx = Point.sub(getClientPos(e), startClientPos)
              const selectionFromPx = Point.add(deltaPx, selectionRect)

              if ((deltaPx.x !== 0 || deltaPx.y !== 0) && !isMoved) {
                isMoved = true
                pushHistory(rootStore)()
              }

              arrangeMoveSelection(rootStore)(
                trackTransform.getArrangePoint(selectionFromPx),
              )
            },
          })
        } else {
          const startPos = trackTransform.getArrangePoint(startPosPx)
          arrangeViewStore.resetSelection()

          if (!player.isPlaying) {
            player.position = arrangeViewStore.quantizer.round(startPos.tick)
          }

          arrangeViewStore.selectedTrackIndex = Math.floor(startPos.trackIndex)

          observeDrag({
            onMouseMove: (e) => {
              const deltaPx = Point.sub(getClientPos(e), startClientPos)
              const selectionToPx = Point.add(startPosPx, deltaPx)
              arrangeResizeSelection(rootStore)(
                startPos,
                trackTransform.getArrangePoint(selectionToPx),
              )
            },
            onMouseUp: (e) => {
              arrangeEndSelection(rootStore)()
            },
          })
        }
      },
      [selection, trackTransform, rootStore, scrollLeft, scrollTop],
    )

    const handleMiddleClick = useCallback(
      (e: React.MouseEvent) => {
        function createPoint(e: MouseEvent) {
          return { x: e.clientX, y: e.clientY }
        }
        const startPos = createPoint(e.nativeEvent)

        observeDrag({
          onMouseMove(e) {
            const pos = createPoint(e)
            const delta = Point.sub(pos, startPos)
            setScrollLeft(Math.max(0, scrollLeft - delta.x))
            setScrollTop(Math.max(0, scrollTop - delta.y))
          },
        })
      },
      [scrollLeft, scrollTop],
    )

    const onMouseDown = useCallback(
      (e: React.MouseEvent) => {
        switch (e.button) {
          case 0:
            handleLeftClick(e)
            break
          case 1:
            handleMiddleClick(e)
            break
          case 2:
            onContextMenu(e)
            break
          default:
            break
        }
      },
      [handleLeftClick, handleMiddleClick, onContextMenu],
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
  },
)
