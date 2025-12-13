import styled from "@emotion/styled"
import { FC, useMemo } from "react"
import { useDisableBounceScroll } from "../../hooks/useDisableBounceScroll"
import { useDisableBrowserContextMenu } from "../../hooks/useDisableBrowserContextMenu"
import { useDisableZoom } from "../../hooks/useDisableZoom"
import { useGlobalKeyboardShortcut } from "../../hooks/useGlobalKeyboardShortcut"
import { useRouter } from "../../hooks/useRouter"
import { useSong } from "../../hooks/useSong"
import { useStores } from "../../hooks/useStores"
import { ArrangeEditor } from "../ArrangeView/ArrangeEditor"
import { BuildInfo } from "../BuildInfo"
import { CloudFileDialog } from "../CloudFileDialog/CloudFileDialog"
import { ControlSettingDialog } from "../ControlSettingDialog/ControlSettingDialog"
import { ExportProgressDialog } from "../ExportDialog/ExportProgressDialog"
import { Head } from "../Head/Head"
import { HelpDialog } from "../Help/HelpDialog"
import { InitialView } from "../InitialView/InitialView"
import { Navigation } from "../Navigation/Navigation"
import { OnBeforeUnload } from "../OnBeforeUnload/OnBeforeUnload"
import { OnInit } from "../OnInit/OnInit"
import { PianoRollEditor } from "../PianoRoll/PianoRollEditor"
import { PublishDialog } from "../PublishDialog/PublishDialog"
import { SettingDialog } from "../SettingDialog/SettingDialog"
import { SignInDialog } from "../SignInDialog/SignInDialog"
import { TransportPanel } from "../TransportPanel/TransportPanel"
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
      {path === "/arrange" && <ArrangeEditor />}
    </>
  )
}

export const RootView: FC = () => {
  const keyboardShortcutProps = useGlobalKeyboardShortcut()
  useDisableZoom()
  useDisableBounceScroll()
  useDisableBrowserContextMenu()
  const { songStore } = useStores()
  const { tracks } = useSong()

  // Check if song has any non-conductor tracks with note events (i.e., has musical content)
  const hasSongContent = useMemo(() => {
    return tracks.some(
      (track) =>
        !track.isConductorTrack &&
        track.events.some((e) => "subtype" in e && e.subtype === "note"),
    )
  }, [tracks])

  // Show initial AI-only view if no song content exists
  if (!hasSongContent) {
    return (
      <>
        <InitialView />
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

  return (
    <>
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
