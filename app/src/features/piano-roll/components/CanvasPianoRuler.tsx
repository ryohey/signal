import { useTheme } from "@emotion/react"
import { LoopSetting } from "@signal-app/player"
import { findLast } from "lodash"
import React, { FC, useCallback } from "react"
import { Layout } from "../../../Constants"
import DrawCanvas from "../../../components/DrawCanvas"
import { TickTransform } from "../../../entities/transform/TickTransform"
import { useQuantizer } from "../../../hooks/useQuantizer"
import { RulerBeat, RulerTimeSignature } from "../../../hooks/useRuler"
import { useTickScroll } from "../../../hooks/useTickScroll"
import { Theme } from "../../../theme/Theme"

const textPadding = 2
const TIME_SIGNATURE_HIT_WIDTH = 20

function drawRuler(
  ctx: CanvasRenderingContext2D,
  height: number,
  beats: RulerBeat[],
  theme: Theme,
) {
  ctx.strokeStyle = theme.secondaryTextColor
  ctx.lineWidth = 1
  ctx.beginPath()

  beats.forEach(({ beat, x, label }) => {
    if (beat === 0) {
      ctx.moveTo(x, height / 2)
      ctx.lineTo(x, height)
    } else {
      ctx.moveTo(x, height * 0.8)
      ctx.lineTo(x, height)
    }
    if (label) {
      ctx.textBaseline = "top"
      ctx.font = `12px ${theme.canvasFont}`
      ctx.fillStyle = theme.secondaryTextColor
      ctx.fillText(label, x + textPadding, textPadding)
    }
  })

  ctx.closePath()
  ctx.stroke()
}

function drawLoopPoints(
  ctx: CanvasRenderingContext2D,
  loop: LoopSetting,
  height: number,
  transform: TickTransform,
  theme: Theme,
) {
  const flagSize = 8
  ctx.lineWidth = 1
  ctx.fillStyle = loop.enabled ? theme.themeColor : theme.secondaryTextColor
  ctx.strokeStyle = loop.enabled ? theme.themeColor : theme.secondaryTextColor
  ctx.beginPath()

  const beginX = transform.getX(loop.begin)
  const endX = transform.getX(loop.end)

  if (loop.begin !== null) {
    const x = beginX
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)

    ctx.moveTo(x, 0)
    ctx.lineTo(x + flagSize, 0)
    ctx.lineTo(x, flagSize)
  }

  if (loop.end !== null) {
    const x = endX
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)

    ctx.moveTo(x, 0)
    ctx.lineTo(x - flagSize, 0)
    ctx.lineTo(x, flagSize)
  }

  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

function drawFlag(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  flagSize: number,
) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width + flagSize, y)
  ctx.lineTo(x + width, y + height)
  ctx.lineTo(x, y + height)
  ctx.lineTo(x, y)
  ctx.closePath()
  ctx.fill()
}

function drawTimeSignatures(
  ctx: CanvasRenderingContext2D,
  height: number,
  events: RulerTimeSignature[],
  theme: Theme,
) {
  ctx.textBaseline = "bottom"
  ctx.font = `11px ${theme.canvasFont}`
  events.forEach((e) => {
    const label = `${e.numerator}/${e.denominator}`
    const size = ctx.measureText(label)
    const textHeight =
      size.actualBoundingBoxAscent + size.actualBoundingBoxDescent
    ctx.fillStyle = e.isSelected
      ? theme.themeColor
      : theme.secondaryBackgroundColor
    const flagHeight = textHeight + textPadding * 4
    drawFlag(
      ctx,
      e.x,
      height - flagHeight,
      size.width + textPadding * 2,
      flagHeight,
      textHeight,
    )
    ctx.fillStyle = e.isSelected ? theme.onSurfaceColor : theme.textColor
    ctx.fillText(label, e.x + textPadding, height - textPadding)
  })
}

export interface PianoRulerProps {
  rulerBeats: RulerBeat[]
  timeSignatures: RulerTimeSignature[]
  loop: LoopSetting | null
  onMouseDown?: React.MouseEventHandler<HTMLCanvasElement>
  onClickTimeSignature: (
    e: React.MouseEvent<HTMLCanvasElement>,
    timeSignature: RulerTimeSignature,
    tick: number,
  ) => void
  onClickRuler: (e: React.MouseEvent<HTMLCanvasElement>, tick: number) => void
  onRightClick: (e: React.MouseEvent<HTMLCanvasElement>, tick: number) => void
  style?: React.CSSProperties
  className?: string
}

export const CanvasPianoRuler: FC<PianoRulerProps> = ({
  rulerBeats,
  timeSignatures,
  loop,
  onMouseDown: _onMouseDown,
  onClickTimeSignature,
  onClickRuler,
  onRightClick,
  style,
  className,
}) => {
  const theme = useTheme()
  const { canvasWidth: width, scrollLeft, transform } = useTickScroll()
  const { quantizeRound } = useQuantizer()
  const height = Layout.rulerHeight

  const getTick = useCallback(
    (offsetX: number) => transform.getTick(offsetX + scrollLeft),
    [transform, scrollLeft],
  )

  const getQuantizedTick = useCallback(
    (offsetX: number) => quantizeRound(getTick(offsetX)),
    [quantizeRound, getTick],
  )

  const timeSignatureHitTest = useCallback(
    (offsetX: number) => {
      const x = offsetX + scrollLeft
      return findLast(
        timeSignatures,
        (e) => e.x < x && e.x + TIME_SIGNATURE_HIT_WIDTH >= x,
      )
    },
    [timeSignatures, scrollLeft],
  )

  const onMouseDown: React.MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      const timeSignature = timeSignatureHitTest(e.nativeEvent.offsetX)
      const tick = getQuantizedTick(e.nativeEvent.offsetX)

      if (timeSignature !== undefined) {
        onClickTimeSignature(e, timeSignature, tick)
      } else {
        if (e.button === 2) {
          onRightClick(e, tick)
        } else {
          onClickRuler(e, tick)
        }
      }

      _onMouseDown?.(e)
    },
    [
      getQuantizedTick,
      timeSignatureHitTest,
      onClickTimeSignature,
      onClickRuler,
      onRightClick,
      _onMouseDown,
    ],
  )

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.translate(-scrollLeft + 0.5, 0)
      drawRuler(ctx, height, rulerBeats, theme)
      if (loop !== null) {
        drawLoopPoints(ctx, loop, height, transform, theme)
      }
      drawTimeSignatures(ctx, height, timeSignatures, theme)
      ctx.restore()
    },
    [width, transform, scrollLeft, rulerBeats, timeSignatures, loop, theme],
  )

  return (
    <DrawCanvas
      draw={draw}
      width={width}
      height={height}
      onMouseDown={onMouseDown}
      onContextMenu={(e) => e.preventDefault()}
      style={style}
      className={className}
    />
  )
}
