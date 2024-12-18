import { useTheme } from "@emotion/react"
import styled from "@emotion/styled"
import useComponentSize from "@rehooks/component-size"
import { clamp } from "lodash"
import { observer } from "mobx-react-lite"
import { FC, useCallback, useEffect, useRef } from "react"
import { Layout, WHEEL_SCROLL_RATE } from "../../Constants"
import {
  arrangeEndSelection,
  arrangeResizeSelection,
  selectTrack,
} from "../../actions"
import { Point } from "../../entities/geometry/Point"
import { ArrangePoint } from "../../entities/transform/ArrangePoint"
import { getClientPos } from "../../helpers/mouseEvent"
import { observeDrag } from "../../helpers/observeDrag"
import { isTouchPadEvent } from "../../helpers/touchpad"
import { useContextMenu } from "../../hooks/useContextMenu"
import { useStores } from "../../hooks/useStores"
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

const Wrapper = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  position: relative;
  background: ${({ theme }) => theme.backgroundColor};
  overflow: hidden;
`

const LeftTopSpace = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  box-sizing: border-box;
  border-bottom: 1px solid ${({ theme }) => theme.dividerColor};
  background: ${({ theme }) => theme.backgroundColor};
`

const LeftBottomSpace = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  background: ${({ theme }) => theme.backgroundColor};
`

const TrackHeader = styled.div<{ isSelected: boolean }>`
  width: 8rem;
  padding: 0 0.5rem;
  box-sizing: border-box;
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.dividerColor};
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: ${({ isSelected, theme }) =>
    isSelected ? theme.secondaryBackgroundColor : theme.backgroundColor};
`

const HeaderList = styled.div`
  position: relative;
  border-right: 1px solid ${({ theme }) => theme.dividerColor};
`

export const ArrangeView: FC = observer(() => {
  const rootStore = useStores()
  const {
    arrangeViewStore,
    arrangeViewStore: {
      trackHeight,
      contentWidth,
      contentHeight,
      transform,
      trackTransform,
      scrollLeft,
      scrollTop,
      scrollBy,
      selectedTrackIndex,
    },
    player,
    router,
    song: { tracks },
  } = rootStore

  const ref = useRef(null)
  const size = useComponentSize(ref)

  const setScrollLeft = useCallback((v: number) => {
    arrangeViewStore.setScrollLeftInPixels(v)
    arrangeViewStore.autoScroll = false
  }, [])
  const setScrollTop = useCallback(
    (v: number) => arrangeViewStore.setScrollTop(v),
    [],
  )

  const containerWidth = size.width

  const theme = useTheme()

  useEffect(() => {
    arrangeViewStore.canvasWidth = size.width
  }, [size.width])

  useEffect(() => {
    arrangeViewStore.canvasHeight = size.height
  }, [size.height])

  const onClickScaleUpHorizontal = useCallback(
    () => arrangeViewStore.scaleAroundPointX(0.2, 0),
    [arrangeViewStore],
  )
  const onClickScaleDownHorizontal = useCallback(
    () => arrangeViewStore.scaleAroundPointX(-0.2, 0),
    [arrangeViewStore],
  )
  const onClickScaleResetHorizontal = useCallback(
    () => (arrangeViewStore.scaleX = 1),
    [arrangeViewStore],
  )

  const onClickScaleUpVertical = useCallback(
    () => arrangeViewStore.setScaleY(arrangeViewStore.scaleY * (1 + 0.2)),
    [arrangeViewStore],
  )
  const onClickScaleDownVertical = useCallback(
    () => arrangeViewStore.setScaleY(arrangeViewStore.scaleY * (1 - 0.2)),
    [arrangeViewStore],
  )
  const onClickScaleResetVertical = useCallback(
    () => arrangeViewStore.setScaleY(1),
    [arrangeViewStore],
  )

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
        arrangeViewStore.setScaleY(arrangeViewStore.scaleY * (1 + scaleYDelta))
      } else if (e.altKey || e.ctrlKey) {
        // horizontal zoom
        const scaleFactor = isTouchPadEvent(e.nativeEvent) ? 0.01 : -0.01
        const scaleXDelta = clamp(e.deltaY * scaleFactor, -0.15, 0.15) // prevent acceleration to zoom too fast
        arrangeViewStore.scaleAroundPointX(scaleXDelta, e.nativeEvent.offsetX)
      } else {
        const scaleFactor = isTouchPadEvent(e.nativeEvent)
          ? 1
          : 20 * transform.pixelsPerKey * WHEEL_SCROLL_RATE
        const deltaY = e.deltaY * scaleFactor
        arrangeViewStore.scrollBy(-e.deltaX, -deltaY)
      }
    },
    [arrangeViewStore, scrollBy],
  )

  const onMouseDownRuler: React.MouseEventHandler<HTMLCanvasElement> =
    useCallback(
      (e) => {
        if (e.button !== 0 || e.ctrlKey || e.altKey) {
          return
        }

        const { scrollLeft, scrollTop, trackTransform } = arrangeViewStore

        const startPosPx: Point = {
          x: e.nativeEvent.offsetX + scrollLeft,
          y: e.nativeEvent.offsetY + scrollTop,
        }
        const startClientPos = getClientPos(e.nativeEvent)

        const startPos: ArrangePoint = {
          tick: trackTransform.getTick(startPosPx.x),
          trackIndex: 0,
        }
        arrangeViewStore.resetSelection()

        observeDrag({
          onMouseMove: (e) => {
            const deltaPx = Point.sub(getClientPos(e), startClientPos)
            const selectionToPx = Point.add(startPosPx, deltaPx)
            const endPos = {
              tick: trackTransform.getTick(selectionToPx.x),
              trackIndex: tracks.length,
            }
            arrangeResizeSelection(rootStore)(startPos, endPos)
          },
          onMouseUp: (e) => {
            arrangeEndSelection(rootStore)()
          },
        })
      },
      [arrangeViewStore, player, rootStore],
    )

  const openTrack = (trackId: TrackId) => {
    router.pushTrack()
    selectTrack(rootStore)(trackId)
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
              onClick={() => (arrangeViewStore.selectedTrackIndex = i)}
              onDoubleClick={() => openTrack(t.id)}
              onContextMenu={(e) => {
                arrangeViewStore.selectedTrackIndex = i
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
            rulerStore={arrangeViewStore.rulerStore}
            onMouseDown={onMouseDownRuler}
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
})
