import styled from "@emotion/styled"
import useComponentSize from "@rehooks/component-size"
import { observer } from "mobx-react-lite"
import { FC, useCallback, useEffect, useRef } from "react"
import { Layout } from "../../Constants"
import { useStores } from "../../hooks/useStores"
import { useTheme } from "../../hooks/useTheme"
import CanvasPianoRuler from "../PianoRoll/CanvasPianoRuler"
import { BAR_WIDTH, HorizontalScrollBar } from "../inputs/ScrollBar"
import { TempoGraphAxis } from "./TempoGraphAxis"
import { TempoGraphCanvas } from "./TempoGraphCanvas/TempoGraphCanvas"

const Wrapper = styled.div`
  position: relative;
  flex-grow: 1;
  background: ${({ theme }) => theme.backgroundColor};
  color: ${({ theme }) => theme.secondaryTextColor};
`

export const TempoGraph: FC = observer(() => {
  const {
    tempoEditorStore,
    tempoEditorStore: { transform, scrollLeft: _scrollLeft, contentWidth },
  } = useStores()

  const ref = useRef(null)
  const size = useComponentSize(ref)

  const theme = useTheme()

  const scrollLeft = Math.floor(_scrollLeft)

  const containerWidth = size.width
  const containerHeight = size.height

  const contentHeight = containerHeight - Layout.rulerHeight - BAR_WIDTH

  useEffect(() => {
    tempoEditorStore.canvasWidth = containerWidth
    tempoEditorStore.canvasHeight = contentHeight
  }, [containerWidth, contentHeight])

  return (
    <Wrapper ref={ref}>
      <CanvasPianoRuler
        rulerStore={tempoEditorStore.rulerStore}
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
        onScroll={useCallback(
          (v: any) => tempoEditorStore.setScrollLeft(v),
          [tempoEditorStore],
        )}
      />
    </Wrapper>
  )
})
