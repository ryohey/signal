import { useTheme } from "@emotion/react"
import styled from "@emotion/styled"
import Color from "color"
import React, { FC, useCallback, useMemo } from "react"
import { Layout } from "../../Constants"
import { Point } from "../../entities/geometry/Point"
import { KeySignature } from "../../entities/scale/KeySignature"
import { noteNameWithOctString } from "../../helpers/noteNumberString"
import { observeDrag2 } from "../../helpers/observeDrag"
import { useContextMenu } from "../../hooks/useContextMenu"
import { useKeyScroll } from "../../hooks/useKeyScroll"
import { usePianoKeys } from "../../hooks/usePianoKeys"
import { Theme } from "../../theme/Theme"
import DrawCanvas from "../DrawCanvas"
import { PianoKeysContextMenu } from "./PianoKeysContextMenu"

// 0: white, 1: black
const Colors = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0]

function makeBlackKeyFillStyle(
  ctx: CanvasRenderingContext2D,
  width: number,
): CanvasFillStrokeStyles["fillStyle"] {
  const grd = ctx.createLinearGradient(0, 0, width, 0)
  grd.addColorStop(0.0, "rgba(33, 33, 33, 1.000)")
  grd.addColorStop(0.895, "rgba(96, 93, 93, 1.000)")
  grd.addColorStop(0.924, "rgba(48, 48, 48, 1.000)")
  grd.addColorStop(1.0, "rgba(0, 0, 0, 1.000)")
  return grd
}

function drawBorder(
  ctx: CanvasRenderingContext2D,
  width: number,
  dividerColor: string,
): void {
  ctx.lineWidth = 1
  ctx.strokeStyle = dividerColor
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(width, 0)
  ctx.closePath()
  ctx.stroke()
}

function drawWhiteKey(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: Theme,
  isSelected: boolean,
  isInScale: boolean,
  bordered: boolean,
): void {
  if (isSelected) {
    ctx.fillStyle = theme.themeColor
    ctx.fillRect(0, 0.5, width, height)
  }
  if (isInScale) {
    ctx.fillStyle = theme.themeColor
    ctx.fillRect(width - 4, 0.5, 4, height)
  }
  if (bordered) {
    drawBorder(ctx, width, theme.dividerColor)
  }
}

function drawBlackKey(
  ctx: CanvasRenderingContext2D,
  keyWidth: number,
  width: number,
  height: number,
  theme: Theme,
  isInScale: boolean,
  fillStyle: CanvasFillStrokeStyles["fillStyle"],
  dividerColor: string,
): void {
  const middle = Math.round(height / 2)

  ctx.fillStyle = fillStyle
  ctx.fillRect(0, 0.5, keyWidth, height)

  if (isInScale) {
    ctx.fillStyle = theme.themeColor
    ctx.fillRect(keyWidth - 4, 0.5, 4, height)
  }

  ctx.lineWidth = 1
  ctx.strokeStyle = dividerColor
  ctx.beginPath()
  ctx.moveTo(keyWidth, middle)
  ctx.lineTo(width, middle)
  ctx.closePath()
  ctx.stroke()
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  label: string,
  font: string,
  color: string,
) {
  const x = width - 5
  ctx.textAlign = "right"
  ctx.textBaseline = "middle"
  ctx.font = `12px ${font}`
  ctx.fillStyle = color
  ctx.fillText(label, x, height / 2)
}

function drawKeys(
  ctx: CanvasRenderingContext2D,
  blackKeyWidth: number,
  width: number,
  keyHeight: number,
  numberOfKeys: number,
  theme: Theme,
  selectedKeys: Set<number>,
  scale: number[],
) {
  ctx.save()
  ctx.translate(0, 0.5)

  ctx.fillStyle = theme.pianoKeyWhite
  ctx.fillRect(0, 0, width, keyHeight * numberOfKeys)

  const allKeys = [...Array(numberOfKeys).keys()]
  const whiteKeys = allKeys.filter((i) => Colors[i % Colors.length] === 0)
  const blackKeys = allKeys.filter((i) => Colors[i % Colors.length] === 1)

  drawBorder(ctx, width, theme.dividerColor)

  // Draw white keys
  for (const keyNum of whiteKeys) {
    let y = (numberOfKeys - keyNum - 1) * keyHeight
    const isSelected = selectedKeys.has(keyNum)
    const isInScale = scale.includes(keyNum % 12)

    const bordered = keyNum % 12 === 4 || keyNum % 12 === 11
    const prevKeyBlack = Colors[(keyNum - 1) % Colors.length] === 1
    const nextKeyBlack = Colors[(keyNum + 1) % Colors.length] === 1

    let height = keyHeight
    if (prevKeyBlack) {
      height += 0.5 * keyHeight
    }
    if (nextKeyBlack) {
      y -= 0.5 * keyHeight
      height += 0.5 * keyHeight
    }

    ctx.save()
    ctx.translate(0, y)

    drawWhiteKey(ctx, width, height, theme, isSelected, isInScale, bordered)
    ctx.restore()
  }

  const blackKeyFillStyle = makeBlackKeyFillStyle(ctx, blackKeyWidth)
  const grayDividerColor = Color(theme.dividerColor).alpha(0.3).string()

  // Draw black keys
  for (const keyNum of blackKeys) {
    const y = (numberOfKeys - keyNum - 1) * keyHeight
    const isSelected = selectedKeys.has(keyNum)
    const isInScale = scale.includes(keyNum % 12)

    ctx.save()
    ctx.translate(0, y)

    drawBlackKey(
      ctx,
      blackKeyWidth,
      width,
      keyHeight,
      theme,
      isInScale,
      isSelected ? theme.themeColor : blackKeyFillStyle,
      grayDividerColor,
    )
    ctx.restore()
  }

  // Draw labels
  const labels = new Map(
    allKeys
      .filter((i) => i % 12 === 0)
      .map((i) => [i, noteNameWithOctString(i)]),
  )
  for (const [keyNum, label] of labels) {
    const y = (numberOfKeys - keyNum - 1) * keyHeight
    ctx.save()
    ctx.translate(0, y)
    drawLabel(
      ctx,
      width,
      keyHeight,
      label,
      theme.canvasFont,
      theme.secondaryTextColor,
    )
    ctx.restore()
  }

  ctx.restore()
}

const Wrapper = styled.div``

const DrumKeysContainer = styled.div`
  border-right: 1px solid var(--color-divider);
  pointer-events: none;
`

const DrumKeyLabelBody = styled.div`
  position: absolute;
  left: 0;
  width: ${Layout.drumKeysWidth}px;
  display: flex;
  align-items: center;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  border-bottom: 1px solid rgb(from var(--color-divider) r g b / 40%);
  padding-left: 0.25rem;

  &:last-child {
    border-top: 1px solid var(--color-divider);
  }

  &[data-highlighted="true"] {
    border-bottom: 1px solid var(--color-divider);
  }
`

const DrumKeyLabel: FC<{
  noteNumber: number
  name: string
}> = ({ noteNumber, name }) => {
  const { transform } = useKeyScroll()
  const style = useMemo(
    () => ({
      top: transform.getY(noteNumber),
      height: transform.pixelsPerKey,
    }),
    [noteNumber, transform],
  )

  return (
    <DrumKeyLabelBody
      style={style}
      data-highlighted={noteNumber % 12 === 0 ? true : false}
    >
      {name}
    </DrumKeyLabelBody>
  )
}

const DrumKeys: FC<{ width: number; keyNames: Map<number, string> }> = ({
  width,
  keyNames,
}) => {
  const drumKeyNames = Array.from(keyNames.entries())
  const style = useMemo(() => ({ width: width - 1 }), [width])

  return (
    <DrumKeysContainer style={style}>
      {drumKeyNames.map(([noteNumber, name]) => (
        <DrumKeyLabel key={noteNumber} noteNumber={noteNumber} name={name} />
      ))}
    </DrumKeysContainer>
  )
}

const PianoKeysCanvas: FC<{ style: React.CSSProperties }> = ({ style }) => {
  const theme = useTheme()
  const blackKeyWidth = Layout.keyWidth * Layout.blackKeyWidthRatio
  const { keySignature, keyHeight, numberOfKeys, selectedKeys } = usePianoKeys()

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const scale =
        keySignature !== null ? KeySignature.getIntervals(keySignature) : []
      drawKeys(
        ctx,
        blackKeyWidth,
        Layout.keyWidth,
        keyHeight,
        numberOfKeys,
        theme,
        selectedKeys,
        scale,
      )
    },
    [numberOfKeys, theme, selectedKeys, keySignature, keyHeight, blackKeyWidth],
  )

  return (
    <DrawCanvas
      draw={draw}
      width={Layout.keyWidth}
      height={keyHeight * numberOfKeys}
      style={style}
    />
  )
}

export interface PianoKeysProps {
  width: number
}

export const PianoKeys: FC<PianoKeysProps> = ({ width }) => {
  const blackKeyWidth = Layout.keyWidth * Layout.blackKeyWidthRatio
  const { onContextMenu, menuProps } = useContextMenu()
  const {
    keyHeight,
    numberOfKeys,
    keyNames,
    onMouseDownKey,
    onMouseMoveKey,
    onMouseUpKey,
  } = usePianoKeys()

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) {
        return
      }

      const blackKeyArea = keyNames
        ? Layout.drumKeysWidth + blackKeyWidth
        : blackKeyWidth

      function posToNoteNumber(x: number, y: number): number {
        const noteNumberFloat = numberOfKeys - y / keyHeight
        const noteNumber = Math.floor(noteNumberFloat)
        const isBlack = Colors[noteNumber % Colors.length] !== 0

        // If you are on the white tab below a black key, round to the nearest
        // white note.
        if (x > blackKeyArea && isBlack) {
          const touchingNextWhite =
            Math.round(noteNumberFloat) - Math.floor(noteNumberFloat)
          return touchingNextWhite ? noteNumber + 1 : noteNumber - 1
        }
        return noteNumber
      }

      const startPosition = {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      }

      let prevNoteNumber = posToNoteNumber(startPosition.x, startPosition.y)
      onMouseDownKey(prevNoteNumber)

      observeDrag2(e.nativeEvent, {
        onMouseMove(_e, delta) {
          const pos = Point.add(startPosition, delta)
          const noteNumber = posToNoteNumber(pos.x, pos.y)
          if (noteNumber !== prevNoteNumber) {
            onMouseMoveKey(noteNumber)
            prevNoteNumber = noteNumber
          }
        },
        onMouseUp() {
          onMouseUpKey()
        },
      })
    },
    [
      numberOfKeys,
      keyHeight,
      blackKeyWidth,
      onMouseDownKey,
      onMouseMoveKey,
      onMouseUpKey,
      keyNames,
    ],
  )

  const style: React.CSSProperties = useMemo(
    () => ({ width, height: keyHeight * numberOfKeys }),
    [width, keyHeight, numberOfKeys],
  )

  const canvasStyle: React.CSSProperties = useMemo(
    () => ({
      position: "absolute",
      top: 0,
      left: keyNames ? Layout.drumKeysWidth : 0,
      pointerEvents: "none",
    }),
    [keyNames],
  )

  return (
    <>
      <Wrapper
        onMouseDown={onMouseDown}
        onContextMenu={onContextMenu}
        style={style}
      >
        {keyNames && (
          <DrumKeys width={Layout.drumKeysWidth} keyNames={keyNames} />
        )}
        <PianoKeysCanvas style={canvasStyle} />
      </Wrapper>
      <PianoKeysContextMenu {...menuProps} />
    </>
  )
}
