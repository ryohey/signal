import { useTheme } from "@emotion/react"
import { GLFallback, GLNode, HitArea, useTransform } from "@ryohey/webgl-react"
import { isNoteEvent } from "@signal-app/core"
import Color from "color"
import { type FC, useCallback, useMemo } from "react"
import { useChangeNotesVelocity } from "../../../actions"
import type { Rect } from "../../../entities/geometry/Rect"
import type { VelocityTransform } from "../../../entities/transform/VelocityTransform"
import { colorToVec4, enhanceContrast } from "../../../gl/color"
import { observeDrag } from "../../../helpers/observeDrag"
import { useEventView } from "../../../hooks/useEventView"
import { usePianoRoll } from "../../../hooks/usePianoRoll"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { LegacyVelocityItems } from "../../GLNodes/legacy/LegacyVelocityItems"
import { type IVelocityData, VelocityShader } from "./VelocityShader"

export interface VelocityItemsProps {
  velocityTransform: VelocityTransform
  zIndex?: number
}

export const VelocityItems: FC<VelocityItemsProps> = ({
  velocityTransform,
  ...props
}) => {
  const { selectedNoteIds } = usePianoRoll()
  const { transform } = useTickScroll()
  const windowedEvents = useEventView()
  const changeNotesVelocity = useChangeNotesVelocity()

  const items = useMemo(
    () =>
      windowedEvents.filter(isNoteEvent).map((note) => {
        const x = transform.getX(note.tick)
        const itemWidth = 5
        return {
          id: note.id,
          x,
          y: velocityTransform.getY(note.velocity),
          width: itemWidth,
          height: velocityTransform.getHeight(note.velocity),
          isSelected: selectedNoteIds.includes(note.id),
        }
      }),
    [windowedEvents, velocityTransform, transform, selectedNoteIds]
  )

  const onMouseDown = useCallback(
    (e: MouseEvent, noteId: number) => {
      const startY = e.clientY - e.offsetY
      const calcValue = (e: MouseEvent) => {
        const offsetY = e.clientY - startY
        return velocityTransform.getVelocity(offsetY)
      }

      e.stopPropagation()
      changeNotesVelocity([noteId], calcValue(e))

      observeDrag({
        onMouseMove: (e) => changeNotesVelocity([noteId], calcValue(e)),
      })
    },
    [changeNotesVelocity, velocityTransform]
  )

  return (
    <>
      <GLFallback
        component={_VelocityItems}
        fallback={LegacyVelocityItems}
        rects={items}
        {...props}
      />
      {items.map((rect) => (
        <VelocityHitArea
          key={rect.id}
          rect={rect}
          height={velocityTransform.maxHeight}
          zIndex={props.zIndex || 0}
          onMouseDown={onMouseDown}
        />
      ))}
    </>
  )
}

const _VelocityItems: FC<{
  rects: (Rect & IVelocityData)[]
  zIndex?: number
}> = ({ rects, zIndex }) => {
  const projectionMatrix = useTransform()
  const theme = useTheme()
  const baseColor = Color(theme.themeColor)
  const strokeColor = colorToVec4(
    enhanceContrast(baseColor, theme.isLightContent, 0.3)
  )
  const activeColor = useMemo(() => colorToVec4(baseColor), [baseColor])
  const selectedColor = useMemo(
    () => colorToVec4(baseColor.lighten(0.7)),
    [baseColor]
  )

  return (
    <GLNode
      shader={VelocityShader}
      uniforms={{
        projectionMatrix,
        strokeColor,
        activeColor,
        selectedColor,
      }}
      buffer={rects}
      zIndex={zIndex}
    />
  )
}

const VelocityHitArea = ({
  rect,
  height,
  zIndex,
  onMouseDown,
}: {
  rect: Rect & { id: number }
  height: number
  zIndex: number
  onMouseDown: (e: MouseEvent, noteId: number) => void
}) => {
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      onMouseDown(e, rect.id)
    },
    [onMouseDown, rect.id]
  )
  const bounds = useMemo(
    () => ({
      x: rect.x,
      y: 0,
      width: rect.width,
      height: height,
    }),
    [rect.x, rect.width, height]
  )
  return (
    <HitArea bounds={bounds} zIndex={zIndex} onMouseDown={handleMouseDown} />
  )
}
