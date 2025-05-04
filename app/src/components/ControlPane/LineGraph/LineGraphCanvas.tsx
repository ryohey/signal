import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { CSSProperties, FC, useMemo } from "react"
import { Point } from "../../../entities/geometry/Point"
import { Rect } from "../../../entities/geometry/Rect"
import { ControlCoordTransform } from "../../../entities/transform/ControlCoordTransform"
import { matrixFromTranslation } from "../../../helpers/matrix"
import { useControlPane } from "../../../hooks/useControlPane"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { Beats } from "../../GLNodes/Beats"
import { Cursor } from "../../GLNodes/Cursor"
import { Selection } from "../../GLNodes/Selection"
import { LineGraphItems } from "./LineGraphItems"

interface IDValue {
  id: number
}

export interface LineGraphCanvasProps {
  width: number
  height: number
  maxValue: number
  items: (Point & IDValue)[]
  controlPoints: (Rect & IDValue)[]
  style?: CSSProperties
  onMouseDown: React.MouseEventHandler<Element>
  onContextMenu: React.MouseEventHandler<Element>
}

const lineWidth = 2

export const LineGraphCanvas: FC<LineGraphCanvasProps> = ({
  items,
  width,
  height,
  style,
  maxValue,
  controlPoints,
  onMouseDown,
  onContextMenu,
}) => {
  const { selection, selectedEventIds, cursorX, beats } = useControlPane()
  const { transform: tickTransform, scrollLeft } = useTickScroll()

  const controlTransform = useMemo(
    () => new ControlCoordTransform(tickTransform, maxValue, height, lineWidth),
    [tickTransform.id, maxValue, height],
  )

  const selectionRect =
    selection !== null ? controlTransform.transformSelection(selection) : null

  const scrollXMatrix = useMemo(
    () => matrixFromTranslation(-Math.floor(scrollLeft), 0),
    [scrollLeft],
  )

  return (
    <GLCanvas
      width={width}
      height={height}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
      style={style}
    >
      <Transform matrix={scrollXMatrix}>
        <Beats height={height} beats={beats} zIndex={0} />
        <LineGraphItems
          scrollLeft={scrollLeft}
          width={width}
          items={items}
          selectedEventIds={selectedEventIds}
          controlPoints={controlPoints}
          lineWidth={2}
          zIndex={1}
        />
        <Selection rect={selectionRect} zIndex={2} />
        <Cursor x={cursorX} height={height} zIndex={3} />
      </Transform>
    </GLCanvas>
  )
}
