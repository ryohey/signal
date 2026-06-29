import { useTheme } from "@emotion/react"
import { GLCanvas, Transform } from "@ryohey/webgl-react"
import { FC, useMemo } from "react"
import { Beats } from "../../../../components/GLNodes/Beats"
import { Cursor } from "../../../../components/GLNodes/Cursor"
import { matrixFromTranslation } from "../../../../helpers/matrix"
import { useBeats } from "../../../../hooks/useBeats"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { VelocityTransform } from "../../entities/VelocityTransform"
import { useVelocityPaintGesture } from "../../gestures/useVelocityPaintGesture"
import { VelocityItems } from "./VelocityItems"

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
      onMouseDown={velocityPaintGesture}
    >
      <Transform matrix={scrollXMatrix}>
        <VelocityItems velocityTransform={velocityTransform} zIndex={1} />
        <Beats height={height} beats={beats} zIndex={2} />
        <Cursor x={cursorX} height={height} zIndex={4} />
      </Transform>
    </GLCanvas>
  )
}
