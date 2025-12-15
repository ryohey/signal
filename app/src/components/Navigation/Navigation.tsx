import styled from "@emotion/styled"
import CodeTags from "mdi-react/CodeTagsIcon"
import Help from "mdi-react/HelpCircleIcon"
import Headphones from "mdi-react/HeadphonesIcon"
import Robot from "mdi-react/RobotIcon"
import Settings from "mdi-react/SettingsIcon"
import { CSSProperties, FC, MouseEvent, useCallback } from "react"
import { getPlatform, isRunningInElectron } from "../../helpers/platform"
import { useAIChat } from "../../hooks/useAIChat"
import { useEditorMode } from "../../hooks/useEditorMode"
import { useHQRender } from "../../hooks/useHQRender"
import { useRootView } from "../../hooks/useRootView"
import { useRouter } from "../../hooks/useRouter"
import ArrangeIcon from "../../images/icons/arrange.svg"
import PianoIcon from "../../images/icons/piano.svg"
import { envString } from "../../localize/envString"
import { Localized } from "../../localize/useLocalization"
import { CircularProgress } from "../ui/CircularProgress"
import { Tooltip } from "../ui/Tooltip"
import { EditMenuButton } from "./EditMenuButton"
import { FileMenuButton } from "./FileMenuButton"

const Container = styled.div`
  display: flex;
  flex-direction: row;
  background: var(--color-background-dark);
  height: 3.25rem;
  flex-shrink: 0;
  -webkit-app-region: drag;
  border-bottom: 1px solid var(--color-divider);
  padding: ${() => {
    if (isRunningInElectron()) {
      const platform = getPlatform()
      switch (platform) {
        case "Windows":
          return "0 0 0 0"
        case "macOS":
          return "0 0 0 76px"
      }
    }
  }};
`

export const Tab = styled.div<{ isActive?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 1.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  position: relative;
  color: ${({ isActive }) =>
    isActive ? "var(--color-text)" : "var(--color-text-secondary)"};
  background: transparent;
  cursor: pointer;
  -webkit-app-region: none;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%) scaleX(${({ isActive }) => isActive ? 1 : 0});
    width: calc(100% - 1.5rem);
    height: 2px;
    background: var(--color-theme);
    border-radius: 1px 1px 0 0;
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  &.active {
    color: var(--color-text);
  }

  &.active::after {
    transform: translateX(-50%) scaleX(1);
  }

  &:hover {
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.03);
  }

  &:hover::after {
    transform: translateX(-50%) scaleX(0.6);
  }

  &:active {
    transform: scale(0.98);
  }

  a {
    color: inherit;
    text-decoration: none;
  }
`

export const TabTitle = styled.span`
  margin-left: 0.625rem;

  @media (max-width: 850px) {
    display: none;
  }
`

const FlexibleSpacer = styled.div`
  flex-grow: 1;
`

const ModeToggleContainer = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 0.5rem;
  padding: 0.1875rem;
  margin: 0 0.5rem;
  -webkit-app-region: none;
  cursor: pointer;
`

const ModeToggleOption = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border: none;
  border-radius: 0.375rem;
  background: ${({ isActive }) => isActive ? "var(--color-theme)" : "transparent"};
  color: ${({ isActive }) => isActive ? "var(--color-on-surface)" : "var(--color-text-secondary)"};
  font-size: 0.6875rem;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-app-region: none;

  &:hover {
    color: ${({ isActive }) => isActive ? "var(--color-on-surface)" : "var(--color-text)"};
    background: ${({ isActive }) => isActive ? "var(--color-theme)" : "rgba(255, 255, 255, 0.06)"};
  }

  svg {
    width: 0.875rem;
    height: 0.875rem;
    fill: currentColor;
  }
`

export const IconStyle: CSSProperties = {
  width: "1.3rem",
  height: "1.3rem",
  fill: "currentColor",
}

export const Navigation: FC = () => {
  const { setOpenSettingDialog, setOpenHelpDialog } = useRootView()
  const { path, setPath } = useRouter()
  const { isOpen: isAIChatOpen, toggle: toggleAIChat } = useAIChat()
  const { toggle: toggleEditorMode, isAdvanced } = useEditorMode()
  const { render: renderHQ, isLoading: isRenderLoading } = useHQRender()

  const onClickPianoRollTab = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      setPath("/track")
    },
    [setPath],
  )

  const onClickArrangeTab = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      setPath("/arrange")
    },
    [setPath],
  )

  const onClickSettings = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      setOpenSettingDialog(true)
    },
    [setOpenSettingDialog],
  )

  const onClickHelp = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      setOpenHelpDialog(true)
    },
    [setOpenHelpDialog],
  )

  const onClickAI = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      toggleAIChat()
    },
    [toggleAIChat],
  )

  const onClickRenderHQ = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      if (!isRenderLoading) {
        renderHQ()
      }
    },
    [renderHQ, isRenderLoading],
  )

  return (
    <Container>
      {!isRunningInElectron() && <FileMenuButton />}
      {!isRunningInElectron() && <EditMenuButton />}

      <Tooltip
        title={`Edit notes for a single track [${envString.cmdOrCtrl}+1]`}
        delayDuration={500}
      >
        <Tab
          className={path === "/track" ? "active" : undefined}
          onMouseDown={onClickPianoRollTab}
        >
          <PianoIcon style={IconStyle} viewBox="0 0 128 128" />
          <TabTitle>
            <Localized name="piano-roll" />
          </TabTitle>
        </Tab>
      </Tooltip>

      <Tooltip
        title={`View and arrange all tracks [${envString.cmdOrCtrl}+2]`}
        delayDuration={500}
      >
        <Tab
          className={path === "/arrange" ? "active" : undefined}
          onMouseDown={onClickArrangeTab}
        >
          <ArrangeIcon style={IconStyle} viewBox="0 0 128 128" />
          <TabTitle>
            <Localized name="arrange" />
          </TabTitle>
        </Tab>
      </Tooltip>

      <FlexibleSpacer />

      <Tooltip title="Toggle between simple and advanced editing modes" delayDuration={500}>
        <ModeToggleContainer>
          <ModeToggleOption
            isActive={!isAdvanced}
            onClick={() => isAdvanced && toggleEditorMode()}
          >
            Simple
          </ModeToggleOption>
          <ModeToggleOption
            isActive={isAdvanced}
            onClick={() => !isAdvanced && toggleEditorMode()}
          >
            <CodeTags />
            Advanced
          </ModeToggleOption>
        </ModeToggleContainer>
      </Tooltip>

      <Tooltip title="AI-powered music generation assistant" delayDuration={500}>
        <Tab isActive={isAIChatOpen} onClick={onClickAI}>
          <Robot style={IconStyle} />
          <TabTitle>AI</TabTitle>
        </Tab>
      </Tooltip>

      <Tooltip title="Render high-quality audio with FluidSynth" delayDuration={500}>
        <Tab onClick={onClickRenderHQ} style={{ opacity: isRenderLoading ? 0.7 : 1 }}>
          {isRenderLoading ? (
            <CircularProgress size="1.3rem" />
          ) : (
            <Headphones style={IconStyle} />
          )}
          <TabTitle>Render</TabTitle>
        </Tab>
      </Tooltip>

      {!isRunningInElectron() && (
        <>
          <Tooltip title="App preferences and audio settings" delayDuration={500}>
            <Tab onClick={onClickSettings}>
              <Settings style={IconStyle} />
              <TabTitle>
                <Localized name="settings" />
              </TabTitle>
            </Tab>
          </Tooltip>

          <Tooltip title="Keyboard shortcuts and documentation" delayDuration={500}>
            <Tab onClick={onClickHelp}>
              <Help style={IconStyle} />
              <TabTitle>
                <Localized name="help" />
              </TabTitle>
            </Tab>
          </Tooltip>
        </>
      )}
    </Container>
  )
}
