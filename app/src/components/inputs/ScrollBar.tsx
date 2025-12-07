import styled from "@emotion/styled"
import useComponentSize from "@rehooks/component-size"
import ArrowDropUp from "mdi-react/ArrowDropUpIcon"
import React, { type FC, useRef } from "react"
import type { Point } from "../../entities/geometry/Point"
import { observeDrag, observeDrag2 } from "../../helpers/observeDrag"

export const BAR_WIDTH = 17
const BUTTON_SIZE = 15
const MIN_THUMB_LENGTH = BAR_WIDTH

const LONG_PRESS_DELAY = 300
const LONG_PRESS_INTERVAL = 50
const LONG_PRESS_SPEED = 0.5
const SCROLL_BASE_AMOUNT = 20

function normalize(v: number): number {
  return Math.max(0, Math.min(1, v))
}

export interface ScrollBarProps {
  children?: React.ReactNode
  isVertical: boolean
  barLength: number
  scrollOffset?: number
  contentLength?: number
  onScroll?: (scroll: number) => void
}

const Thumb = styled.div`
  box-sizing: border-box;
`

const Container = styled.div`
  height: 100%;
  width: 100%;
  position: absolute;
  display: flex;

  &.vertical {
    width: ${BAR_WIDTH}px;
    height: 100%;
    position: absolute;
    top: 0;
    right: 0;
    flex-direction: column;

    .button-backward .triangle {
      transform: rotate(0deg) scale(1.1);
    }

    .button-forward .triangle {
      transform: rotate(180deg) scale(1.1);
    }
  }

  &.horizontal {
    width: 100%;
    height: ${BAR_WIDTH}px;
    position: absolute;
    bottom: 0;
    left: 0;
    flex-direction: row;

    & > div {
      height: 100%;
    }

    .button-backward .triangle {
      transform: rotate(-90deg) scale(1.1);
    }

    .button-forward .triangle {
      transform: rotate(90deg) scale(1.1);
    }
  }

  .triangle {
    flex-grow: 1;
    pointer-events: none;
    width: 15px;
    height: 15px;
  }

  .button-backward,
  .button-forward {
    text-align: center;
    align-content: center;
    display: flex;
  }
`

const _ScrollBar: React.ForwardRefRenderFunction<
  HTMLDivElement,
  ScrollBarProps
> = (
  {
    isVertical,
    barLength,
    scrollOffset = 50,
    contentLength = 1000,
    onScroll,
    children,
  },
  ref
) => {
  const buttonLength = BUTTON_SIZE
  const maxOffset = contentLength - barLength
  const maxLength = barLength - buttonLength * 2
  const valueRatio = normalize(barLength / contentLength)
  const thumbLength = Math.max(MIN_THUMB_LENGTH, maxLength * valueRatio)
  const disabled = maxOffset <= 0

  let pageForwardLength: number
  let pageBackwardLength: number

  if (disabled) {
    pageForwardLength = 0
    pageBackwardLength = maxLength
  } else {
    pageForwardLength = Math.floor(
      (maxLength - thumbLength) * normalize(scrollOffset / maxOffset)
    )
    pageBackwardLength = Math.floor(maxLength - thumbLength - pageForwardLength)
  }

  const className = isVertical ? "vertical" : "horizontal"
  const lengthProp = isVertical ? "height" : "width"

  const onScroll2 = (scroll: number) =>
    onScroll?.(Math.min(maxOffset, Math.max(0, scroll)))

  const handleMouseDown =
    (delta: number) => (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()

      if (disabled) {
        return
      }

      const currentTarget = e.target
      const startPos = getPoint(e)

      let intervalId = 0
      let scroll = scrollOffset
      onScroll2((scroll += delta))

      const isHoverOnTarget = () =>
        document.elementFromPoint(startPos.x, startPos.y) === currentTarget

      const startLongPressTimer = (delta: number) => {
        // 初回は時間をかける
        // Take time for the first time
        intervalId = window.setInterval(() => {
          clearInterval(intervalId)

          if (!isHoverOnTarget()) {
            return
          }

          onScroll2((scroll += delta))

          // 二回目からは素早く繰り返す
          // Repeat quickly from the second time
          intervalId = window.setInterval(() => {
            onScroll2((scroll += delta * LONG_PRESS_SPEED))

            if (!isHoverOnTarget()) {
              stopLongPressTimer()
            }
          }, LONG_PRESS_INTERVAL)
        }, LONG_PRESS_DELAY)
      }

      const stopLongPressTimer = () => {
        clearInterval(intervalId)
        intervalId = 0
      }

      startLongPressTimer(delta)

      observeDrag({
        onMouseMove: (e) => {
          if (currentTarget !== e.target) {
            stopLongPressTimer()
          }
        },
        onMouseUp: () => {
          stopLongPressTimer()
        },
      })
    }

  const onMouseDownThumb = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()

    if (disabled) {
      return
    }

    const elm = e.target as HTMLDivElement

    if (elm.classList.contains("thumb")) {
      const startValue = scrollOffset

      observeDrag2(e.nativeEvent, {
        onMouseMove: (e, delta) => {
          const p = isVertical ? "y" : "x"
          const scale = maxOffset / (maxLength - thumbLength) // 移動量とスクロール量の補正値 -> Correction value of movement amount and scroll amount
          const value = startValue + delta[p] * scale
          onScroll2(value)
        },
      })
    }
  }

  const triangle = <ArrowDropUp className="triangle" />

  return (
    <Container ref={ref} className={`ScrollBar ${className}`}>
      <div
        className="button-backward"
        style={{ [lengthProp]: buttonLength }}
        onMouseDown={handleMouseDown(-SCROLL_BASE_AMOUNT)}
      >
        {triangle}
      </div>
      <div
        className="page-backward"
        style={{ [lengthProp]: pageForwardLength }}
        onMouseDown={handleMouseDown(-4 * SCROLL_BASE_AMOUNT)}
      />
      {!disabled && (
        <Thumb
          className="thumb"
          style={{ [lengthProp]: thumbLength }}
          onMouseDown={onMouseDownThumb}
        />
      )}
      <div
        className="page-forward"
        style={{ [lengthProp]: pageBackwardLength }}
        onMouseDown={handleMouseDown(4 * SCROLL_BASE_AMOUNT)}
      />
      <div
        className="button-forward"
        style={{ [lengthProp]: buttonLength }}
        onMouseDown={handleMouseDown(SCROLL_BASE_AMOUNT)}
      >
        {triangle}
      </div>
      {children}
    </Container>
  )
}

export const ScrollBar = React.forwardRef(_ScrollBar)

function getPoint(e: MouseEvent | React.MouseEvent): Point {
  return {
    x: e.pageX,
    y: e.pageY,
  }
}

type VerticalScrollBar_Props = Omit<ScrollBarProps, "isVertical" | "barLength">
type HorizontalScrollBar_Props = VerticalScrollBar_Props

const VerticalScrollBar_: FC<
  React.PropsWithChildren<VerticalScrollBar_Props>
> = (props) => {
  const ref = useRef<HTMLDivElement>(null)
  const size = useComponentSize(ref)
  return (
    <ScrollBar ref={ref} isVertical={true} {...props} barLength={size.height} />
  )
}

const HorizontalScrollBar_: FC<
  React.PropsWithChildren<HorizontalScrollBar_Props>
> = (props) => {
  const ref = useRef<HTMLDivElement>(null)
  const size = useComponentSize(ref)
  return (
    <ScrollBar ref={ref} isVertical={false} {...props} barLength={size.width} />
  )
}

export type VerticalScrollBarProps = Omit<VerticalScrollBar_Props, "size">
export type HorizontalScrollBarProps = Omit<HorizontalScrollBar_Props, "size">

const areEqual = (
  props: VerticalScrollBar_Props,
  nextProps: VerticalScrollBar_Props
) =>
  props.scrollOffset === nextProps.scrollOffset &&
  props.contentLength === nextProps.contentLength &&
  props.onScroll === nextProps.onScroll

export const VerticalScrollBar = React.memo(VerticalScrollBar_, areEqual)
export const HorizontalScrollBar = React.memo(HorizontalScrollBar_, areEqual)
