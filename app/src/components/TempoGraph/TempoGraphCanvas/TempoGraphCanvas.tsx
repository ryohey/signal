import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { observer } from "mobx-react-lite"
import { CSSProperties, FC, useCallback, useMemo } from "react"
import { changeTempo } from "../../../actions"
import { Point } from "../../../entities/geometry/Point"
import { bpmToUSecPerBeat, uSecPerBeatToBPM } from "../../../helpers/bpm"
import { matrixFromTranslation } from "../../../helpers/matrix"
import { useStores } from "../../../hooks/useStores"
import { Beats } from "../../GLNodes/Beats"
import { Cursor } from "../../GLNodes/Cursor"
import { Selection } from "../../GLNodes/Selection"
import { handleCreateSelectionDrag } from "../MouseHandler/handleCreateSelectionDrag"
import { handlePencilMouseDown } from "../MouseHandler/handlePencilMouseDown"
import { handleSelectionDragEvents } from "../MouseHandler/handleSelectionDragEvents"
import { Lines } from "./Lines"
import { TempoItems } from "./TempoItems"

export interface TempoGraphCanvasProps {
  width: number
  height: number
  style?: CSSProperties
}

export const TempoGraphCanvas: FC<TempoGraphCanvasProps> = observer(
  ({ width, height, style }) => {
    const rootStore = useStores()

    const {
      tempoEditorStore,
      tempoEditorStore: {
        items,
        transform,
        scrollLeft: _scrollLeft,
        mouseMode,
        rulerStore: { beats },
        cursorX,
        selectionRect,
      },
    } = rootStore

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

        handlePencilMouseDown(rootStore)(
          e.nativeEvent,
          getLocal(e.nativeEvent),
          transform,
        )
      },
      [rootStore, transform, scrollLeft, mouseMode],
    )

    const selectionMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (e.button !== 0) {
          return
        }

        const local = getLocal(e.nativeEvent)
        const hitEventId = tempoEditorStore.hitTest(local)

        if (hitEventId !== undefined) {
          handleSelectionDragEvents(rootStore)(
            e.nativeEvent,
            hitEventId,
            local,
            transform,
          )
        } else {
          handleCreateSelectionDrag(rootStore)(e.nativeEvent, local, transform)
        }
      },
      [rootStore, transform, scrollLeft],
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
        changeTempo(rootStore)(
          event.id,
          Math.floor(bpmToUSecPerBeat(bpm + movement)),
        )
      },
      [items, rootStore, scrollLeft],
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
        style={style}
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
  },
)
