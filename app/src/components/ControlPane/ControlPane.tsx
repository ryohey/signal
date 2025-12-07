import styled from "@emotion/styled"
import useComponentSize from "@rehooks/component-size"
import DotsHorizontalIcon from "mdi-react/DotsHorizontalIcon"
import React, { type FC, useCallback, useRef } from "react"
import {
  type ControlMode,
  isEqualControlMode,
} from "../../entities/control/ControlMode"
import { useControlPane } from "../../hooks/useControlPane"
import { useControlPaneKeyboardShortcut } from "../../hooks/useControlPaneKeyboardShortcut"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { useRootView } from "../../hooks/useRootView"
import { ControlName } from "./ControlName"
import { ValueEventGraph } from "./Graph/ValueEventGraph"
import PianoVelocityControl from "./VelocityControl/VelocityControl"

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
  width: 7rem;
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
      {controlModes.map((mode, i) => (
        <TabButton
          data-selected={isEqualControlMode(selectedMode, mode)}
          onMouseDown={() => onSelect(mode)}
          key={i}
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
  background: var(--color-background-dark);
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
`

const TAB_HEIGHT = 30
const BORDER_WIDTH = 1

export interface ControlPaneProps {
  axisWidth: number
}

const ControlPane: FC<ControlPaneProps> = ({ axisWidth }) => {
  const ref = useRef(null)
  const containerSize = useComponentSize(ref)
  const { setActivePane } = usePianoRoll()
  const { controlMode: mode, setControlMode } = useControlPane()
  const keyboardShortcutProps = useControlPaneKeyboardShortcut()

  const onFocus = useCallback(() => setActivePane("control"), [setActivePane])
  const onBlur = useCallback(() => setActivePane(null), [setActivePane])

  const controlSize = {
    width: containerSize.width - axisWidth - BORDER_WIDTH,
    height: containerSize.height - TAB_HEIGHT,
    axisWidth,
  }

  const control = (() => {
    switch (mode.type) {
      case "velocity":
        return <PianoVelocityControl {...controlSize} />
      default:
        return <ValueEventGraph {...controlSize} type={mode} />
    }
  })()

  return (
    <Parent
      ref={ref}
      {...keyboardShortcutProps}
      tabIndex={0}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <TabBarWrapper style={{ paddingLeft: axisWidth }}>
        <TabBar onSelect={setControlMode} selectedMode={mode} />
      </TabBarWrapper>
      <Content>{control}</Content>
    </Parent>
  )
}

export default ControlPane
