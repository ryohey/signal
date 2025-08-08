import { useTheme } from "@emotion/react"
import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { FC, useCallback, useMemo } from "react"
import {
  useChangeNotesVelocity,
  useUpdateVelocitiesInRange,
} from "../../../actions"
import { Point } from "../../../entities/geometry/Point"
import { Rect } from "../../../entities/geometry/Rect"
import { matrixFromTranslation } from "../../../helpers/matrix"
import { observeDrag, observeDrag2 } from "../../../helpers/observeDrag"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { useRuler } from "../../../hooks/useRuler"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { isNoteEvent } from "../../../track"
import { Beats } from "../../GLNodes/Beats"
import { Cursor } from "../../GLNodes/Cursor"
import { VelocityItems } from "./VelocityItems"

export type VelocityItem = Rect & {
  id: number
  isSelected: boolean
  hitArea: Rect
}

export const VelocityControlCanvas: FC<{ width: number; height: number }> = ({
  width,
  height,
}) => {
  const { transform, windowedEvents, selectedNoteIds } = usePianoRoll()
  const { beats } = useRuler()
  const { cursorX, scrollLeft } = useTickScroll()
  const updateVelocitiesInRange = useUpdateVelocitiesInRange()
  const changeNotesVelocity = useChangeNotesVelocity()
  const theme = useTheme()

  const items: VelocityItem[] = useMemo(
    () =>
      windowedEvents.filter(isNoteEvent).map((note) => {
        const { x } = transform.getRect(note)
        const itemWidth = 5
        const itemHeight = (note.velocity / 127) * height
        return {
          id: note.id,
          x,
          y: height - itemHeight,
          width: itemWidth,
          height: itemHeight,
          isSelected: selectedNoteIds.includes(note.id),
          hitArea: {
            x,
            y: 0,
            width: itemWidth,
            height,
          },
        }
      }),
    [windowedEvents, height, transform, selectedNoteIds],
  )

  const hitTest = useCallback(
    (point: Point) => {
      return items.filter((n) => Rect.containsPoint(n.hitArea, point))
    },
    [items],
  )

  const onMouseDown = useCallback(
    (ev: React.MouseEvent) => {
      const e = ev.nativeEvent
      const startPoint = {
        x: e.offsetX + scrollLeft,
        y: e.offsetY,
      }
      let hitItems = hitTest(startPoint)

      if (selectedNoteIds.length > 0) {
        hitItems = hitItems.filter((e) => e.isSelected)
      }

      const startY = e.clientY - e.offsetY

      const calcValue = (e: MouseEvent) => {
        const offsetY = e.clientY - startY
        return Math.max(
          1,
          Math.round(Math.max(0, Math.min(1, 1 - offsetY / height)) * 127),
        )
      }

      if (hitItems.length === 0) {
        handlePaintingDrag()
      } else {
        handleSingleDrag()
      }

      function handlePaintingDrag() {
        let lastTick = transform.getTick(startPoint.x)
        let lastValue = calcValue(e)

        observeDrag2(e, {
          onMouseMove: (e, delta) => {
            const local = Point.add(startPoint, delta)
            const tick = transform.getTick(local.x)
            const value = calcValue(e)

            updateVelocitiesInRange(lastTick, lastValue, tick, value)
            lastTick = tick
            lastValue = value
          },
        })
      }

      function handleSingleDrag() {
        const noteIds = hitItems.map((e) => e.id)

        changeNotesVelocity(noteIds, calcValue(e))

        observeDrag({
          onMouseMove: (e) => changeNotesVelocity(noteIds, calcValue(e)),
        })
      }
    },
    [
      height,
      selectedNoteIds,
      scrollLeft,
      updateVelocitiesInRange,
      changeNotesVelocity,
      hitTest,
      transform,
    ],
  )

  const scrollXMatrix = useMemo(
    () => matrixFromTranslation(-scrollLeft, 0),
    [scrollLeft],
  )

  return (
    <GLCanvas
      width={width}
      height={height}
      style={{
        backgroundColor: theme.editorBackgroundColor,
      }}
      onMouseDown={onMouseDown}
    >
      <Transform matrix={scrollXMatrix}>
        <VelocityItems rects={items} zIndex={1} />
        <Beats height={height} beats={beats} zIndex={2} />
        <Cursor x={cursorX} height={height} zIndex={4} />
      </Transform>
    </GLCanvas>
  )
}
