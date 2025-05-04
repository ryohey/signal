import { useTheme } from "@emotion/react"
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

export const TempoGraph: FC = () => {
  const { transform, contentWidth, rulerStore, setCanvasHeight } =
    useTempoEditor()
  const {
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
  const theme = useTheme()

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
      <CanvasPianoRuler
        rulerStore={rulerStore}
        style={{
          background: theme.backgroundColor,
          borderBottom: `1px solid ${theme.dividerColor}`,
          boxSizing: "border-box",
          position: "absolute",
          left: Layout.keyWidth,
        }}
      />
      <TempoGraphCanvas
        width={containerWidth}
        height={contentHeight}
        style={{
          position: "absolute",
          top: Layout.rulerHeight,
          left: Layout.keyWidth,
          backgroundColor: theme.editorBackgroundColor,
        }}
      />
      <TempoGraphAxis
        width={Layout.keyWidth}
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
