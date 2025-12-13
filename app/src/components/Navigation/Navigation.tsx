import styled from "@emotion/styled"
import Forum from "mdi-react/ForumIcon"
import Help from "mdi-react/HelpCircleIcon"
import Settings from "mdi-react/SettingsIcon"
import {
  type CSSProperties,
  type FC,
  type MouseEvent,
  useCallback,
} from "react"
import { getPlatform, isRunningInElectron } from "../../helpers/platform"
import { useRootView } from "../../hooks/useRootView"
import { useRouter } from "../../hooks/useRouter"
import ArrangeIcon from "../../images/icons/arrange.svg"
import PianoIcon from "../../images/icons/piano.svg"
import TempoIcon from "../../images/icons/tempo.svg"
import { envString } from "../../localize/envString"
import { Localized } from "../../localize/useLocalization"
import { Tooltip } from "../ui/Tooltip"
import { EditMenuButton } from "./EditMenuButton"
import { FileMenuButton } from "./FileMenuButton"
import { UserButton } from "./UserButton"

const Container = styled.div`
  display: flex;
  flex-direction: row;
  background: var(--color-background-dark);
  height: 3rem;
  flex-shrink: 0;
  -webkit-app-region: drag;
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

export const Tab = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center; 
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  border-top: solid 0.1rem transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  -webkit-app-region: none;

  &.active {
    color: var(--color-text);
    background: var(--color-background);
    border-top-color: var(--color-theme);
  }

  &:hover {
    background: var(--color-highlight);
  }

  a {
    color: inherit;
    text-decoration: none;
  }
}
`

export const TabTitle = styled.span`
  margin-left: 0.5rem;

  @media (max-width: 850px) {
    display: none;
  }
`

const FlexibleSpacer = styled.div`
  flex-grow: 1;
`

export const IconStyle: CSSProperties = {
  width: "1.3rem",
  height: "1.3rem",
  fill: "currentColor",
}

export const Navigation: FC = () => {
  const { setOpenSettingDialog, setOpenHelpDialog } = useRootView()
  const { path, setPath } = useRouter()

  const onClickPianoRollTab = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      setPath("/track")
    },
    [setPath]
  )

  const onClickArrangeTab = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      setPath("/arrange")
    },
    [setPath]
  )

  const onClickTempoTab = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      setPath("/tempo")
    },
    [setPath]
  )

  const onClickSettings = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      setOpenSettingDialog(true)
    },
    [setOpenSettingDialog]
  )

  const onClickHelp = useCallback(
    (e: MouseEvent) => {
      e.preventDefault()
      setOpenHelpDialog(true)
    },
    [setOpenHelpDialog]
  )

  return (
    <Container>
      {!isRunningInElectron() && <FileMenuButton />}
      {!isRunningInElectron() && <EditMenuButton />}

      <Tooltip
        title={
          <>
            <Localized name="switch-tab" /> [{envString.cmdOrCtrl}+1]
          </>
        }
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
        title={
          <>
            <Localized name="switch-tab" /> [{envString.cmdOrCtrl}+2]
          </>
        }
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

      <Tooltip
        title={
          <>
            <Localized name="switch-tab" /> [{envString.cmdOrCtrl}+3]
          </>
        }
        delayDuration={500}
      >
        <Tab
          className={path === "/tempo" ? "active" : undefined}
          onMouseDown={onClickTempoTab}
        >
          <TempoIcon style={IconStyle} viewBox="0 0 128 128" />
          <TabTitle>
            <Localized name="tempo" />
          </TabTitle>
        </Tab>
      </Tooltip>

      <FlexibleSpacer />

      {!isRunningInElectron() && (
        <>
          <Tab onClick={onClickSettings}>
            <Settings style={IconStyle} />
            <TabTitle>
              <Localized name="settings" />
            </TabTitle>
          </Tab>

          <Tab onClick={onClickHelp}>
            <Help style={IconStyle} />
            <TabTitle>
              <Localized name="help" />
            </TabTitle>
          </Tab>

          <Tab>
            <Forum style={IconStyle} />
            <TabTitle>
              <a
                href="https://discord.gg/XQxzNdDJse"
                target="_blank"
                rel="noreferrer"
              >
                Discord
              </a>
            </TabTitle>
          </Tab>
        </>
      )}

      <UserButton />
    </Container>
  )
}
