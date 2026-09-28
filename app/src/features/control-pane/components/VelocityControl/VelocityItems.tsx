import { useTheme } from "@emotion/react"
import { GLFallback, GLNode, HitArea, useTransform } from "@ryohey/webgl-react"
import type { VelocityItem } from "@signal-app/velocity-editor"
import type { Rect } from "@signal-app/geometry"
import Color from "color"
import { type FC, useCallback, useMemo } from "react"
import { colorToVec4, enhanceContrast } from "../../../../gl/color"
import { useTickScroll } from "../../../../hooks/useTickScroll"
import { usePianoRoll } from "../../../piano-roll/hooks/usePianoRoll"
import type { VelocityTransform } from "../../entities/VelocityTransform"
import { useVelocityItems } from "../../hooks/useVelocityItems"
import { LegacyVelocityItems } from "./LegacyVelocityItems"
import { type IVelocityData, VelocityShader } from "./VelocityShader"

export interface VelocityItemsProps {
  velocityTransform: VelocityTransform
  onMouseDown: (e: MouseEvent, noteId: number) => void
  zIndex?: number
}

const itemWidth = 5

export const VelocityItems: FC<VelocityItemsProps> = ({
  velocityTransform,
  onMouseDown,
  ...props
}) => {
  const velocityItems = useVelocityItems()
  const { transform } = useTickScroll()
  const { selectedNoteIds } = usePianoRoll()

  const transformEvent = useCallback(
    (item: VelocityItem) => {
      const x = transform.getX(item.tick)
      return {
        id: item.id,
        x,
        y: velocityTransform.getY(item.velocity),
        width: itemWidth,
        height: velocityTransform.getHeight(item.velocity),
        isSelected: selectedNoteIds.includes(item.id),
      }
    },
    [selectedNoteIds, transform, velocityTransform],
  )

  const items = useMemo(
    () => velocityItems.map(transformEvent),
    [velocityItems, transformEvent],
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
}> = ({ rects, zIndex = 0 }) => {
  const projectionMatrix = useTransform()
  const theme = useTheme()
  const baseColor = Color(theme.themeColor)
  const strokeColor = colorToVec4(
    enhanceContrast(baseColor, theme.isLightContent, 0.3),
  )
  const activeColor = useMemo(() => colorToVec4(baseColor), [baseColor])
  const selectedColor = useMemo(
    () => colorToVec4(baseColor.lighten(0.7)),
    [baseColor],
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
    [onMouseDown, rect.id],
  )
  const bounds = useMemo(
    () => ({
      x: rect.x,
      y: 0,
      width: rect.width,
      height: height,
    }),
    [rect.x, rect.width, height],
  )
  return (
    <HitArea bounds={bounds} zIndex={zIndex} onMouseDown={handleMouseDown} />
  )
}
