import { useTheme } from "@emotion/react"
import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { FC, useMemo } from "react"
import { VelocityTransform } from "../../../entities/transform/VelocityTransform"
import { matrixFromTranslation } from "../../../helpers/matrix"
import { useBeats } from "../../../hooks/useRuler"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { Beats } from "../../GLNodes/Beats"
import { Cursor } from "../../GLNodes/Cursor"
import { VelocityItems } from "./VelocityItems"
import { useVelocityPaintGesture } from "./useVelocityPaintGesture"

export const VelocityControlCanvas: FC<{ width: number; height: number }> = ({
  width,
  height,
}) => {
  const beats = useBeats()
  const { cursorX, scrollLeft } = useTickScroll()
  const theme = useTheme()
  const velocityTransform = useMemo(
    () => new VelocityTransform(height),
    [height],
  )
  const velocityPaintGesture = useVelocityPaintGesture({
    velocityTransform: velocityTransform,
  })
  const scrollXMatrix = useMemo(
    () => matrixFromTranslation(-scrollLeft, 0),
    [scrollLeft],
  )
  const style = useMemo(
    () => ({
      backgroundColor: theme.editorBackgroundColor,
    }),
    [theme],
  )

  return (
    <GLCanvas
      width={width}
      height={height}
      style={style}
      onMouseDown={velocityPaintGesture.onMouseDown}
    >
      <Transform matrix={scrollXMatrix}>
        <VelocityItems velocityTransform={velocityTransform} zIndex={1} />
        <Beats height={height} beats={beats} zIndex={2} />
        <Cursor x={cursorX} height={height} zIndex={4} />
      </Transform>
    </GLCanvas>
  )
}
