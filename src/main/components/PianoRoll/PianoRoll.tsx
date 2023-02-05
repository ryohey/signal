import styled from "@emotion/styled"
import useComponentSize from "@rehooks/component-size"
import { observer } from "mobx-react-lite"
import { FC, useCallback, useRef } from "react"
import { Layout, WHEEL_SCROLL_RATE } from "../../Constants"
import { handleWheel } from "../../helpers/handleWheel"
import { useStores } from "../../hooks/useStores"
import ControlPane from "../ControlPane/ControlPane"
import {
  HorizontalScaleScrollBar,
  VerticalScaleScrollBar,
} from "../inputs/ScaleScrollBar"
import { PianoRollStage } from "./PianoRollStage"
import { StyledSplitPane } from "./StyledSplitPane"

const Parent = styled.div`
  flex-grow: 1;
  background: ${({ theme }) => theme.backgroundColor};
  position: relative;
`

const Alpha = styled.div`
  flex-grow: 1;
  position: relative;

  .alphaContent {
    position: absolute;
    top: 0;
    left: 0;
  }
`

const Beta = styled.div`
  border-top: 1px solid ${({ theme }) => theme.dividerColor};
  height: calc(100% - 17px);
`

const PianoRollWrapper: FC = observer(() => {
  const {
    pianoRollStore: s,
    pianoRollStore: {
      scaleX,
      scaleY,
      scrollLeft,
      scrollTop,
      transform,
      contentWidth,
      contentHeight,
    },
  } = useStores()

  const ref = useRef(null)
  const size = useComponentSize(ref)

  const alphaRef = useRef(null)
  const { height: alphaHeight = 0 } = useComponentSize(alphaRef)

  const onClickScaleUpHorizontal = useCallback(
    () => s.scaleAroundPointX(0.2, Layout.keyWidth),
    [scaleX, s]
  )
  const onClickScaleDownHorizontal = useCallback(
    () => s.scaleAroundPointX(-0.2, Layout.keyWidth),
    [scaleX, s]
  )
  const onClickScaleResetHorizontal = useCallback(() => (s.scaleX = 1), [s])

  const onClickScaleUpVertical = useCallback(
    () => s.scaleAroundPointY(0.2, 0),
    [scaleY, s]
  )
  const onClickScaleDownVertical = useCallback(
    () => s.scaleAroundPointY(-0.2, 0),
    [scaleY, s]
  )
  const onClickScaleResetVertical = useCallback(() => (s.scaleY = 1), [s])

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const action = handleWheel(e, transform.pixelsPerKey * WHEEL_SCROLL_RATE)
      switch (action.type) {
        case "scaleX":
          s.scaleAroundPointX(action.delta, e.nativeEvent.offsetX)
          break
        case "scaleY":
          s.scaleAroundPointY(action.delta, e.nativeEvent.offsetY)
          break
        case "scroll":
          s.scrollBy(action.x, action.y)
          break
      }
    },
    [s, transform]
  )

  return (
    <Parent ref={ref}>
      <StyledSplitPane split="horizontal" minSize={50} defaultSize={"60%"}>
        <Alpha onWheel={onWheel} ref={alphaRef}>
          <PianoRollStage width={size.width} height={alphaHeight} />
          <VerticalScaleScrollBar
            scrollOffset={scrollTop}
            contentLength={contentHeight}
            onScroll={useCallback((v: any) => s.setScrollTopInPixels(v), [s])}
            onClickScaleUp={onClickScaleUpVertical}
            onClickScaleDown={onClickScaleDownVertical}
            onClickScaleReset={onClickScaleResetVertical}
          />
        </Alpha>
        <Beta>
          <ControlPane />
        </Beta>
      </StyledSplitPane>
      <HorizontalScaleScrollBar
        scrollOffset={scrollLeft}
        contentLength={contentWidth}
        onScroll={useCallback((v: any) => s.setScrollLeftInPixels(v), [s])}
        onClickScaleUp={onClickScaleUpHorizontal}
        onClickScaleDown={onClickScaleDownHorizontal}
        onClickScaleReset={onClickScaleResetHorizontal}
      />
    </Parent>
  )
})

export default PianoRollWrapper
