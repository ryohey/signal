import styled from "@emotion/styled"
import useComponentSize from "@rehooks/component-size"
import DotsHorizontalIcon from "mdi-react/DotsHorizontalIcon"
import React, { FC, HTMLAttributes, useCallback, useRef } from "react"
import { useRootView } from "../../../hooks/useRootView"
import { usePianoRoll } from "../../piano-roll/hooks/usePianoRoll"
import {
  ControlMode,
  controlModeKey,
  isEqualControlMode,
} from "../entities/ControlMode"
import { useControlPane } from "../hooks/useControlPane"
import { ControlName } from "./ControlName"

interface TabBarProps {
  onSelect: (mode: ControlMode) => void
  selectedMode: ControlMode
}

const TabButtonBase = styled.div`
  background: transparent;
  -webkit-appearance: none;
  padding: 0.5em 0.8em;
  color: var(--color-text-secondary);
  outline: none;
  font-size: 0.75rem;
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background: var(--color-highlight);
  }
`

const TabButton = styled(TabButtonBase)`
  min-width: 4rem;
  overflow: hidden;
  border-bottom: 1px solid;
  border-color: transparent;
  color: var(--color-text-secondary);

  &[data-selected="true"] {
    border-color: var(--color-theme);
    color: var(--color-text);
  }
`

const NoWrap = styled.span`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`

const Toolbar = styled.div`
  box-sizing: border-box;
  display: flex;
  height: 2rem;
  flex-shrink: 0;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
`

const TabBar: FC<TabBarProps> = React.memo(({ onSelect, selectedMode }) => {
  const { setOpenControlSettingDialog } = useRootView()
  const { controlModes } = useControlPane()

  return (
    <Toolbar>
      {controlModes.map((mode) => (
        <TabButton
          data-selected={isEqualControlMode(selectedMode, mode)}
          onMouseDown={() => onSelect(mode)}
          key={controlModeKey(mode)}
        >
          <NoWrap>
            <ControlName mode={mode} />
          </NoWrap>
        </TabButton>
      ))}
      <TabButtonBase onClick={() => setOpenControlSettingDialog(true)}>
        <DotsHorizontalIcon style={{ width: "1rem" }} />
      </TabButtonBase>
    </Toolbar>
  )
})

const Parent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  outline: none;
`

const Content = styled.div`
  flex-grow: 1;
  position: relative;

  > canvas,
  > .LineGraph {
    position: absolute;
    top: 0;
    left: 0;
  }
`

const TabBarWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: stretch;
`

const TabBarScrollArea = styled.div`
  flex: 1;
  overflow: hidden;
`

const TAB_HEIGHT = 32
const BORDER_WIDTH = 1

export interface ControlContentProps {
  width: number
  height: number
  axisWidth: number
}

export type ControlLayoutProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "content"
> & {
  axisWidth: number
  content: (props: ControlContentProps) => React.ReactNode
  toolbarTrailing?: React.ReactNode
}

export const ControlLayout: FC<ControlLayoutProps> = ({
  content,
  axisWidth,
  toolbarTrailing,
  ...props
}) => {
  const ref = useRef(null)
  const containerSize = useComponentSize(ref)
  const { setActivePane } = usePianoRoll()
  const { controlMode: mode, setControlMode } = useControlPane()

  const onFocus = useCallback(() => setActivePane("control"), [setActivePane])
  const onBlur = useCallback(() => setActivePane(null), [setActivePane])

  const controlSize = {
    width: containerSize.width - axisWidth - BORDER_WIDTH,
    height: containerSize.height - TAB_HEIGHT,
    axisWidth,
  }

  return (
    <Parent ref={ref} {...props} tabIndex={0} onFocus={onFocus} onBlur={onBlur}>
      <TabBarWrapper style={{ paddingLeft: axisWidth }}>
        <TabBarScrollArea>
          <TabBar onSelect={setControlMode} selectedMode={mode} />
        </TabBarScrollArea>
        {toolbarTrailing}
      </TabBarWrapper>
      <Content>{content(controlSize)}</Content>
    </Parent>
  )
}
