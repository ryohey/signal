import styled from "@emotion/styled"
import useComponentSize from "@rehooks/component-size"
import Add from "mdi-react/AddIcon"
import FiberManualRecord from "mdi-react/FiberManualRecordIcon"
import Minus from "mdi-react/MinusIcon"
import React, { FC, useRef } from "react"
import { BAR_WIDTH, ScrollBar, ScrollBarProps } from "./ScrollBar"

const ScaleButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  > svg {
    width: 15px;
    height: 15px;
    transform: scale(0.8);
  }
`

type HorizontalScaleScrollBarProps = Omit<
  ScrollBarProps,
  "isVertical" | "barLength" | "style"
> & {
  onClickScaleDown?: () => void
  onClickScaleReset?: () => void
  onClickScaleUp?: () => void
}

const HorizontalScaleScrollBar_: FC<HorizontalScaleScrollBarProps> = (
  props,
) => {
  const ref = useRef<HTMLDivElement>(null)
  const size = useComponentSize(ref)

  const buttonSize = BAR_WIDTH
  const barLength = size.width - buttonSize * 3
  const buttonStyle = {
    width: buttonSize,
    height: buttonSize,
  }
  return (
    <ScrollBar ref={ref} isVertical={false} {...props} barLength={barLength}>
      <ScaleButton style={buttonStyle} onClick={props.onClickScaleDown}>
        <Minus />
      </ScaleButton>
      <ScaleButton style={buttonStyle} onClick={props.onClickScaleReset}>
        <FiberManualRecord />
      </ScaleButton>
      <ScaleButton style={buttonStyle} onClick={props.onClickScaleUp}>
        <Add />
      </ScaleButton>
    </ScrollBar>
  )
}

type VerticalScaleScrollBarProps = Omit<
  ScrollBarProps,
  "isVertical" | "barLength" | "style"
> & {
  onClickScaleDown?: () => void
  onClickScaleReset?: () => void
  onClickScaleUp?: () => void
}

const VerticalScaleScrollBar_: FC<
  React.PropsWithChildren<VerticalScaleScrollBarProps>
> = (props) => {
  const ref = useRef<HTMLDivElement>(null)
  const size = useComponentSize(ref)

  const buttonSize = BAR_WIDTH
  const barLength = size.height - buttonSize * 3
  const buttonStyle = {
    width: buttonSize,
    height: buttonSize,
  }
  return (
    <ScrollBar ref={ref} isVertical={true} {...props} barLength={barLength}>
      <ScaleButton style={buttonStyle} onClick={props.onClickScaleUp}>
        <Add />
      </ScaleButton>
      <ScaleButton style={buttonStyle} onClick={props.onClickScaleReset}>
        <FiberManualRecord />
      </ScaleButton>
      <ScaleButton style={buttonStyle} onClick={props.onClickScaleDown}>
        <Minus />
      </ScaleButton>
    </ScrollBar>
  )
}

const areEqual = (
  props: HorizontalScaleScrollBarProps,
  nextProps: HorizontalScaleScrollBarProps,
) =>
  props.scrollOffset === nextProps.scrollOffset &&
  props.contentLength === nextProps.contentLength &&
  props.onScroll === nextProps.onScroll &&
  props.onClickScaleDown === nextProps.onClickScaleDown &&
  props.onClickScaleReset === nextProps.onClickScaleReset &&
  props.onClickScaleUp === nextProps.onClickScaleUp

export const HorizontalScaleScrollBar = React.memo(
  HorizontalScaleScrollBar_,
  areEqual,
)

export const VerticalScaleScrollBar = React.memo(
  VerticalScaleScrollBar_,
  areEqual,
)
