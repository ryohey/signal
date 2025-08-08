import styled from "@emotion/styled"
import useComponentSize from "@rehooks/component-size"
import { FC, useCallback, useEffect, useRef } from "react"
import { Layout } from "../../Constants"
import { useTempoEditor } from "../../hooks/useTempoEditor"
import { useTickScroll } from "../../hooks/useTickScroll"
import CanvasPianoRuler from "../PianoRoll/CanvasPianoRuler"
import { BAR_WIDTH, HorizontalScrollBar } from "../inputs/ScrollBar"
import { TempoGraphAxis } from "./TempoGraphAxis"
import { TempoGraphCanvas } from "./TempoGraphCanvas/TempoGraphCanvas"

const Wrapper = styled.div`
  position: relative;
  flex-grow: 1;
  background: var(--color-background);
  color: var(--color-text-secondary);
`

const AXIS_WIDTH = 64

const StyledRuler = styled(CanvasPianoRuler)`
  position: absolute;
  left: ${AXIS_WIDTH}px;
  top: 0;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-divider);
  box-sizing: border-box;
`

const StyledGraphCanvas = styled(TempoGraphCanvas)`
  position: absolute;
  top: ${Layout.rulerHeight}px;
  left: ${AXIS_WIDTH}px;
  background-color: var(--color-editor-background);
`

export const TempoGraph: FC = () => {
  const { transform, setCanvasHeight } = useTempoEditor()
  const {
    contentWidth,
    scrollLeft: _scrollLeft,
    setCanvasWidth,
    setScrollLeftInPixels,
    setAutoScroll,
  } = useTickScroll()

  const ref = useRef(null)
  const size = useComponentSize(ref)

  const setScrollLeft = useCallback(
    (x: number) => {
      setScrollLeftInPixels(x)
      setAutoScroll(false)
    },
    [setScrollLeftInPixels, setAutoScroll],
  )

  const scrollLeft = Math.floor(_scrollLeft)

  const containerWidth = size.width
  const containerHeight = size.height

  const contentHeight = containerHeight - Layout.rulerHeight - BAR_WIDTH

  useEffect(() => {
    setCanvasWidth(containerWidth)
    setCanvasHeight(contentHeight)
  }, [containerWidth, contentHeight])

  return (
    <Wrapper ref={ref}>
      <StyledRuler />
      <StyledGraphCanvas width={containerWidth} height={contentHeight} />
      <TempoGraphAxis
        width={AXIS_WIDTH}
        offset={Layout.rulerHeight}
        transform={transform}
      />
      <HorizontalScrollBar
        scrollOffset={scrollLeft}
        contentLength={contentWidth}
        onScroll={setScrollLeft}
      />
    </Wrapper>
  )
}
