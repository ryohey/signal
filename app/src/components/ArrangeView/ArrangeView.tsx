import { useTheme } from "@emotion/react"
import styled from "@emotion/styled"
import useComponentSize from "@rehooks/component-size"
import { clamp } from "lodash"
import { FC, useCallback, useEffect, useRef } from "react"
import { Layout, WHEEL_SCROLL_RATE } from "../../Constants"
import { useSelectTrack } from "../../actions"
import { isTouchPadEvent } from "../../helpers/touchpad"
import { useArrangeView } from "../../hooks/useArrangeView"
import { useContextMenu } from "../../hooks/useContextMenu"
import { useRouter } from "../../hooks/useRouter"
import { TrackId } from "../../track"
import CanvasPianoRuler from "../PianoRoll/CanvasPianoRuler"
import { TrackName } from "../TrackList/TrackName"
import {
  HorizontalScaleScrollBar,
  VerticalScaleScrollBar,
} from "../inputs/ScaleScrollBar"
import { BAR_WIDTH } from "../inputs/ScrollBar"
import { ArrangeContextMenu } from "./ArrangeContextMenu"
import { ArrangeTrackContextMenu } from "./ArrangeTrackContextMenu"
import { ArrangeViewCanvas } from "./ArrangeViewCanvas/ArrangeViewCanvas"
import { useRulerSelectionGesture } from "./useRulerSelectionGesture"

const Wrapper = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  position: relative;
  background: var(--color-background);
  overflow: hidden;
`

const LeftTopSpace = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  box-sizing: border-box;
  border-bottom: 1px solid var(--color-divider);
  background: var(--color-background);
`

const LeftBottomSpace = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  background: var(--color-background);
`

const TrackHeader = styled.div<{ isSelected: boolean }>`
  width: 8rem;
  padding: 0 0.5rem;
  box-sizing: border-box;
  display: flex;
  border-bottom: 1px solid var(--color-divider);
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: ${({ isSelected, theme }) =>
    isSelected ? theme.secondaryBackgroundColor : theme.backgroundColor};
`

const HeaderList = styled.div`
  position: relative;
  border-right: 1px solid var(--color-divider);
`

export const ArrangeView: FC = () => {
  const {
    tracks,
    trackHeight,
    contentWidth,
    contentHeight,
    transform,
    scrollLeft,
    scaleY,
    scrollTop,
    scrollBy,
    rulerStore,
    setCanvasWidth,
    setCanvasHeight,
    selectedTrackIndex,
    setScrollLeftInPixels,
    setAutoScroll,
    setScrollTop,
    setScaleX,
    setScaleY,
    scaleAroundPointX,
    setSelectedTrackIndex,
  } = useArrangeView()
  const { setPath } = useRouter()
  const selectTrack = useSelectTrack()
  const rulerSelectionGesture = useRulerSelectionGesture()

  const ref = useRef(null)
  const size = useComponentSize(ref)

  const setScrollLeft = useCallback((v: number) => {
    setScrollLeftInPixels(v)
    setAutoScroll(false)
  }, [])

  const containerWidth = size.width

  const theme = useTheme()

  useEffect(() => {
    setCanvasWidth(containerWidth)
  }, [size.width])

  useEffect(() => {
    setCanvasHeight(size.height)
  }, [size.height])

  const onClickScaleUpHorizontal = useCallback(
    () => scaleAroundPointX(0.2, 0),
    [scaleAroundPointX],
  )
  const onClickScaleDownHorizontal = useCallback(
    () => scaleAroundPointX(-0.2, 0),
    [scaleAroundPointX],
  )
  const onClickScaleResetHorizontal = useCallback(
    () => setScaleX(1),
    [setScaleX],
  )

  const onClickScaleUpVertical = useCallback(
    () => setScaleY(scaleY * (1 + 0.2)),
    [setScaleY, scaleY],
  )
  const onClickScaleDownVertical = useCallback(
    () => setScaleY(scaleY * (1 - 0.2)),
    [setScaleY, scaleY],
  )
  const onClickScaleResetVertical = useCallback(() => setScaleY(1), [setScaleY])

  const { onContextMenu, menuProps } = useContextMenu()
  const { onContextMenu: onTrackContextMenu, menuProps: trackMenuProps } =
    useContextMenu()

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.shiftKey && (e.altKey || e.ctrlKey)) {
        // vertical zoom
        let scaleYDelta = isTouchPadEvent(e.nativeEvent)
          ? 0.02 * e.deltaY
          : 0.01 * e.deltaX
        scaleYDelta = clamp(scaleYDelta, -0.15, 0.15) // prevent acceleration to zoom too fast
        setScaleY(scaleY * (1 + scaleYDelta))
      } else if (e.altKey || e.ctrlKey) {
        // horizontal zoom
        const scaleFactor = isTouchPadEvent(e.nativeEvent) ? 0.01 : -0.01
        const scaleXDelta = clamp(e.deltaY * scaleFactor, -0.15, 0.15) // prevent acceleration to zoom too fast
        scaleAroundPointX(scaleXDelta, e.nativeEvent.offsetX)
      } else {
        const scaleFactor = isTouchPadEvent(e.nativeEvent)
          ? 1
          : 20 * transform.pixelsPerKey * WHEEL_SCROLL_RATE
        const deltaY = e.deltaY * scaleFactor
        scrollBy(-e.deltaX, -deltaY)
      }
    },
    [setScaleY, scaleY, scaleAroundPointX, scrollBy],
  )

  const openTrack = (trackId: TrackId) => {
    setPath("/track")
    selectTrack(trackId)
  }

  return (
    <Wrapper>
      <HeaderList>
        <div
          style={{
            marginTop: Layout.rulerHeight,
            transform: `translateY(${-scrollTop}px)`,
          }}
        >
          {tracks.map((t, i) => (
            <TrackHeader
              style={{ height: trackHeight }}
              key={i}
              isSelected={i === selectedTrackIndex}
              onClick={() => setSelectedTrackIndex(i)}
              onDoubleClick={() => openTrack(t.id)}
              onContextMenu={(e) => {
                setSelectedTrackIndex(i)
                onTrackContextMenu(e)
              }}
            >
              <TrackName track={t} />
            </TrackHeader>
          ))}
        </div>
        <LeftBottomSpace style={{ height: BAR_WIDTH }} />
      </HeaderList>
      <LeftTopSpace style={{ height: Layout.rulerHeight }} />
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          ref={ref}
          onWheel={onWheel}
          style={{
            display: "flex",
            flexGrow: 1,
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
            background: theme.darkBackgroundColor,
          }}
        >
          <CanvasPianoRuler
            rulerStore={rulerStore}
            {...rulerSelectionGesture}
            style={{
              background: theme.backgroundColor,
              borderBottom: `1px solid ${theme.dividerColor}`,
              boxSizing: "border-box",
            }}
          />
          <ArrangeViewCanvas
            width={containerWidth}
            onContextMenu={onContextMenu}
          />
        </div>
        <div
          style={{
            width: `calc(100% - ${BAR_WIDTH}px)`,
            position: "absolute",
            bottom: 0,
          }}
        >
          <HorizontalScaleScrollBar
            scrollOffset={scrollLeft}
            contentLength={contentWidth}
            onScroll={setScrollLeft}
            onClickScaleUp={onClickScaleUpHorizontal}
            onClickScaleDown={onClickScaleDownHorizontal}
            onClickScaleReset={onClickScaleResetHorizontal}
          />
        </div>
      </div>
      <div
        style={{
          height: `calc(100% - ${BAR_WIDTH}px)`,
          position: "absolute",
          top: 0,
          right: 0,
        }}
      >
        <VerticalScaleScrollBar
          scrollOffset={scrollTop}
          contentLength={contentHeight + Layout.rulerHeight}
          onScroll={setScrollTop}
          onClickScaleUp={onClickScaleUpVertical}
          onClickScaleDown={onClickScaleDownVertical}
          onClickScaleReset={onClickScaleResetVertical}
        />
      </div>
      <div
        style={{
          width: BAR_WIDTH,
          height: BAR_WIDTH,
          position: "absolute",
          bottom: 0,
          right: 0,
          background: theme.backgroundColor,
        }}
      />
      <ArrangeContextMenu {...menuProps} />
      <ArrangeTrackContextMenu {...trackMenuProps} />
    </Wrapper>
  )
}
