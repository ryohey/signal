import styled from "@emotion/styled"
import { FC } from "react"
import { ArrangeEditor } from "../../features/arrange/components/ArrangeEditor"
import { CloudFileDialog } from "../../features/cloud-file/components/CloudFileDialog"
import { ControlSettingDialog } from "../../features/control-pane/components/dialogs/ControlSettingDialog"
import { ExportProgressDialog } from "../../features/export/components/ExportProgressDialog"
import { PianoRollEditor } from "../../features/piano-roll/components/PianoRollEditor"
import { SettingDialog } from "../../features/setting/components/SettingDialog"
import { TempoEditor } from "../../features/tempo-editor/components/TempoEditor"
import { TransportPanel } from "../../features/transport-panel/components/TransportPanel"
import { useDisableBounceScroll } from "../../hooks/useDisableBounceScroll"
import { useDisableBrowserContextMenu } from "../../hooks/useDisableBrowserContextMenu"
import { useDisableZoom } from "../../hooks/useDisableZoom"
import { useGlobalKeyboardShortcut } from "../../hooks/useGlobalKeyboardShortcut"
import { useRouter } from "../../hooks/useRouter"
import { BuildInfo } from "../BuildInfo"
import { Head } from "../Head/Head"
import { HelpDialog } from "../Help/HelpDialog"
import { EditMenuChildrenProvider } from "../Navigation/EditMenuPortal"
import { Navigation } from "../Navigation/Navigation"
import { OnBeforeUnload } from "../OnBeforeUnload/OnBeforeUnload"
import { OnInit } from "../OnInit/OnInit"
import { PublishDialog } from "../PublishDialog/PublishDialog"
import { SignInDialog } from "../SignInDialog/SignInDialog"
import { DeleteAccountDialog } from "../UserSettingsDialog/DeleteAccountDialog"
import { UserSettingsDialog } from "../UserSettingsDialog/UserSettingsDialog"
import { DropZone } from "./DropZone"

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
`

const Column = styled.div`
  height: 100%;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  outline: none;
`

const Routes: FC = () => {
  const { path } = useRouter()
  return (
    <>
      {path === "/track" && <PianoRollEditor />}
      {path === "/tempo" && <TempoEditor />}
      {path === "/arrange" && <ArrangeEditor />}
    </>
  )
}

export const RootView: FC = () => {
  const keyboardShortcutProps = useGlobalKeyboardShortcut()
  useDisableZoom()
  useDisableBounceScroll()
  useDisableBrowserContextMenu()

  return (
    <>
      <EditMenuChildrenProvider>
        <DropZone>
          <Column {...keyboardShortcutProps} tabIndex={0}>
            <Navigation />
            <Container>
              <Routes />
              <TransportPanel />
              <BuildInfo />
            </Container>
          </Column>
        </DropZone>
      </EditMenuChildrenProvider>
      <HelpDialog />
      <ExportProgressDialog />
      <Head />
      <SignInDialog />
      <CloudFileDialog />
      <SettingDialog />
      <ControlSettingDialog />
      <OnInit />
      <OnBeforeUnload />
      <PublishDialog />
      <UserSettingsDialog />
      <DeleteAccountDialog />
    </>
  )
}
