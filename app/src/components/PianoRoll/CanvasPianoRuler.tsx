import { useTheme } from "@emotion/react"
import { LoopSetting } from "@signal-app/player"
import { isEqual } from "lodash"
import React, { FC, useCallback, useState } from "react"
import { useUpdateTimeSignature } from "../../actions"
import { Layout } from "../../Constants"
import { BeatWithX } from "../../entities/beat/BeatWithX"
import { TickTransform } from "../../entities/transform/TickTransform"
import { useContextMenu } from "../../hooks/useContextMenu"
import { useRuler } from "../../hooks/useRuler"
import { RulerStore, TimeSignature } from "../../stores/RulerStore"
import { Theme } from "../../theme/Theme"
import DrawCanvas from "../DrawCanvas"
import { RulerContextMenu } from "./RulerContextMenu"
import { TimeSignatureDialog } from "./TimeSignatureDialog"

const textPadding = 2

function drawRuler(
  ctx: CanvasRenderingContext2D,
  height: number,
  beats: BeatWithX[],
  theme: Theme,
) {
  ctx.strokeStyle = theme.secondaryTextColor
  ctx.lineWidth = 1
  ctx.beginPath()

  // 密過ぎる時は省略する
  // Omit when it is too high
  const shouldOmit = beats.length > 1 && beats[1].x - beats[0].x <= 5

  beats.forEach(({ beat, measure, x }) => {
    const isTop = beat === 0

    if (isTop) {
      ctx.moveTo(x, height / 2)
      ctx.lineTo(x, height)
    } else if (!shouldOmit) {
      ctx.moveTo(x, height * 0.8)
      ctx.lineTo(x, height)
    }

    // 小節番号
    // War Number
    // 省略時は2つに1つ描画
    // Default 1 drawing one for two
    if (isTop && (!shouldOmit || measure % 2 === 0)) {
      ctx.textBaseline = "top"
      ctx.font = `12px ${theme.canvasFont}`
      ctx.fillStyle = theme.secondaryTextColor
      ctx.fillText(`${measure + 1}`, x + textPadding, textPadding)
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
  events: TimeSignature[],
  transform: TickTransform,
  theme: Theme,
) {
  ctx.textBaseline = "bottom"
  ctx.font = `11px ${theme.canvasFont}`
  events.forEach((e) => {
    const x = transform.getX(e.tick)
    const text = `${e.numerator}/${e.denominator}`
    const size = ctx.measureText(text)
    const textHeight =
      size.actualBoundingBoxAscent + size.actualBoundingBoxDescent
    ctx.fillStyle = e.isSelected
      ? theme.themeColor
      : theme.secondaryBackgroundColor
    const flagHeight = textHeight + textPadding * 4
    drawFlag(
      ctx,
      x,
      height - flagHeight,
      size.width + textPadding * 2,
      flagHeight,
      textHeight,
    )
    ctx.fillStyle = e.isSelected ? theme.onSurfaceColor : theme.textColor
    ctx.fillText(text, x + textPadding, height - textPadding)
  })
}

export interface PianoRulerProps {
  rulerStore: RulerStore
  onMouseDown?: React.MouseEventHandler<HTMLCanvasElement>
  style?: React.CSSProperties
}

// null = closed
interface TimeSignatureDialogState {
  numerator: number
  denominator: number
}

const PianoRuler: FC<PianoRulerProps> = ({
  rulerStore,
  onMouseDown: _onMouseDown,
  style,
}) => {
  const updateTimeSignature = useUpdateTimeSignature()
  const theme = useTheme()
  const { onContextMenu, menuProps } = useContextMenu()
  const [timeSignatureDialogState, setTimeSignatureDialogState] =
    useState<TimeSignatureDialogState | null>(null)
  const [rightClickTick, setRightClickTick] = useState(0)
  const height = Layout.rulerHeight

  const {
    canvasWidth: width,
    scrollLeft,
    transform,
    beats,
    loop,
    timeSignatures,
    quantizer,
    timeSignatureHitTest,
    setLoopBegin,
    setLoopEnd,
    seek,
  } = useRuler(rulerStore)

  const onClickTimeSignature = (
    timeSignature: TimeSignature,
    e: React.MouseEvent,
  ) => {
    if (e.detail == 2) {
      setTimeSignatureDialogState(timeSignature)
    } else {
      rulerStore.selectedTimeSignatureEventIds = [timeSignature.id]
      if (e.button === 2) {
        setRightClickTick(rulerStore.getQuantizedTick(e.nativeEvent.offsetX))
        onContextMenu(e)
      }
    }
  }

  const onClickRuler: React.MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      const tick = rulerStore.getTick(e.nativeEvent.offsetX)
      const quantizedTick = quantizer.round(tick)
      if (e.nativeEvent.ctrlKey) {
        setLoopBegin(quantizedTick)
      } else if (e.nativeEvent.altKey) {
        setLoopEnd(quantizedTick)
      } else {
        seek(quantizedTick)
      }
    },
    [quantizer, setLoopBegin, setLoopEnd, seek],
  )

  const onMouseDown: React.MouseEventHandler<HTMLCanvasElement> = useCallback(
    (e) => {
      const tick = rulerStore.getTick(e.nativeEvent.offsetX)
      const timeSignature = timeSignatureHitTest(tick)

      if (timeSignature !== undefined) {
        onClickTimeSignature(timeSignature, e)
        onClickRuler(e)
      } else {
        if (e.button == 2) {
          setRightClickTick(rulerStore.getQuantizedTick(e.nativeEvent.offsetX))
          onContextMenu(e)
        } else {
          rulerStore.selectedTimeSignatureEventIds = []
          onClickRuler(e)
        }
      }

      _onMouseDown?.(e)
    },
    [quantizer, scrollLeft, transform, timeSignatures],
  )

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.translate(-scrollLeft + 0.5, 0)
      drawRuler(ctx, height, beats, theme)
      if (loop !== null) {
        drawLoopPoints(ctx, loop, height, transform, theme)
      }
      drawTimeSignatures(ctx, height, timeSignatures, transform, theme)
      ctx.restore()
    },
    [width, transform, scrollLeft, beats, timeSignatures, loop, theme],
  )

  const closeOpenTimeSignatureDialog = useCallback(() => {
    setTimeSignatureDialogState(null)
  }, [])

  const okTimeSignatureDialog = useCallback(
    ({ numerator, denominator }: TimeSignatureDialogState) => {
      rulerStore.selectedTimeSignatureEventIds.forEach((id) => {
        updateTimeSignature(id, numerator, denominator)
      })
    },
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
      />
      <RulerContextMenu
        {...menuProps}
        rulerStore={rulerStore}
        tick={rightClickTick}
      />
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

function equals(props: PianoRulerProps, nextProps: PianoRulerProps) {
  return isEqual(props.style, nextProps.style)
}

export default React.memo(PianoRuler, equals)
