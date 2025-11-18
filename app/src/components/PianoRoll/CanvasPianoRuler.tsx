import { useTheme } from "@emotion/react"
import { TrackEventOf } from "@signal-app/core"
import { LoopSetting } from "@signal-app/player"
import { TimeSignatureEvent } from "midifile-ts"
import React, { FC, useCallback, useState } from "react"
import { Layout } from "../../Constants"
import { TickTransform } from "../../entities/transform/TickTransform"
import { useContextMenu } from "../../hooks/useContextMenu"
import { usePlayer } from "../../hooks/usePlayer"
import { RulerBeat, RulerTimeSignature, useRuler } from "../../hooks/useRuler"
import { useTickScroll } from "../../hooks/useTickScroll"
import { Theme } from "../../theme/Theme"
import DrawCanvas from "../DrawCanvas"
import { RulerContextMenu } from "./RulerContextMenu"
import { TimeSignatureDialog } from "./TimeSignatureDialog"

const textPadding = 2

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
    const size = ctx.measureText(e.label)
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
    ctx.fillText(e.label, e.x + textPadding, height - textPadding)
  })
}

export interface PianoRulerProps {
  onMouseDown?: React.MouseEventHandler<HTMLCanvasElement>
  style?: React.CSSProperties
  className?: string
}

// null = closed
interface TimeSignatureDialogState {
  numerator: number
  denominator: number
}

const PianoRuler: FC<PianoRulerProps> = ({
  onMouseDown: _onMouseDown,
  style,
  className,
}) => {
  const theme = useTheme()
  const { onContextMenu, menuProps } = useContextMenu()
  const [timeSignatureDialogState, setTimeSignatureDialogState] =
    useState<TimeSignatureDialogState | null>(null)
  const [rightClickTick, setRightClickTick] = useState(0)
  const { loop, setLoopBegin, setLoopEnd, setPosition } = usePlayer()
  const height = Layout.rulerHeight

  const {
    rulerBeats,
    timeSignatures,
    timeSignatureHitTest,
    selectTimeSignature,
    clearSelectedTimeSignature,
    updateTimeSignature,
    getQuantizedTick,
  } = useRuler()

  const { canvasWidth: width, scrollLeft, transform } = useTickScroll()

  const onClickTimeSignature = useCallback(
    (timeSignature: TrackEventOf<TimeSignatureEvent>, e: React.MouseEvent) => {
      if (e.detail == 2) {
        setTimeSignatureDialogState(timeSignature)
      } else {
        selectTimeSignature(timeSignature.id)
        if (e.button === 2) {
          setRightClickTick(getQuantizedTick(e.nativeEvent.offsetX))
          onContextMenu(e)
        }
      }
    },
    [
      selectTimeSignature,
      setTimeSignatureDialogState,
      getQuantizedTick,
      onContextMenu,
    ],
  )

  const onClickRuler: React.MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      const quantizedTick = getQuantizedTick(e.nativeEvent.offsetX)
      if (e.nativeEvent.ctrlKey) {
        setLoopBegin(quantizedTick)
      } else if (e.nativeEvent.altKey) {
        setLoopEnd(quantizedTick)
      } else {
        setPosition(quantizedTick)
      }
    },
    [getQuantizedTick, setLoopBegin, setLoopEnd, setPosition],
  )

  const onMouseDown: React.MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      const timeSignature = timeSignatureHitTest(e.nativeEvent.offsetX)

      if (timeSignature !== undefined) {
        onClickTimeSignature(timeSignature.event, e)
        onClickRuler(e)
      } else {
        if (e.button == 2) {
          setRightClickTick(getQuantizedTick(e.nativeEvent.offsetX))
          onContextMenu(e)
        } else {
          clearSelectedTimeSignature()
          onClickRuler(e)
        }
      }

      _onMouseDown?.(e)
    },
    [
      getQuantizedTick,
      timeSignatureHitTest,
      clearSelectedTimeSignature,
      onClickTimeSignature,
      onClickRuler,
      setRightClickTick,
      onContextMenu,
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
    [
      width,
      height,
      transform,
      scrollLeft,
      rulerBeats,
      timeSignatures,
      loop,
      theme,
    ],
  )

  const closeOpenTimeSignatureDialog = useCallback(() => {
    setTimeSignatureDialogState(null)
  }, [])

  const okTimeSignatureDialog = useCallback(
    ({ numerator, denominator }: TimeSignatureDialogState) =>
      updateTimeSignature(numerator, denominator),
    [updateTimeSignature],
  )

  return (
    <>
      <DrawCanvas
        draw={draw}
        width={width}
        height={height}
        onMouseDown={onMouseDown}
        onContextMenu={(e) => e.preventDefault()}
        style={style}
        className={className}
      />
      <RulerContextMenu {...menuProps} tick={rightClickTick} />
      <TimeSignatureDialog
        open={timeSignatureDialogState != null}
        initialNumerator={timeSignatureDialogState?.numerator}
        initialDenominator={timeSignatureDialogState?.denominator}
        onClose={closeOpenTimeSignatureDialog}
        onClickOK={okTimeSignatureDialog}
      />
    </>
  )
}

export default PianoRuler
