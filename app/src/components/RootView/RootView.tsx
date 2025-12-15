import { keyframes } from "@emotion/react"
import styled from "@emotion/styled"
import { FC, useEffect, useMemo, useState } from "react"
import { useDisableBounceScroll } from "../../hooks/useDisableBounceScroll"
import { useDisableBrowserContextMenu } from "../../hooks/useDisableBrowserContextMenu"
import { useDisableZoom } from "../../hooks/useDisableZoom"
import { useGlobalKeyboardShortcut } from "../../hooks/useGlobalKeyboardShortcut"
import { useRouter } from "../../hooks/useRouter"
import { useSong } from "../../hooks/useSong"
import { useStores } from "../../hooks/useStores"
import { ArrangeEditor } from "../ArrangeView/ArrangeEditor"
import { BuildInfo } from "../BuildInfo"
import { ControlSettingDialog } from "../ControlSettingDialog/ControlSettingDialog"
import { ExportProgressDialog } from "../ExportDialog/ExportProgressDialog"
import { Head } from "../Head/Head"
import { HelpDialog } from "../Help/HelpDialog"
import { InitialView } from "../InitialView/InitialView"
import { Navigation } from "../Navigation/Navigation"
import { OnBeforeUnload } from "../OnBeforeUnload/OnBeforeUnload"
import { OnInit } from "../OnInit/OnInit"
import { PianoRollEditor } from "../PianoRoll/PianoRollEditor"
import { SettingDialog } from "../SettingDialog/SettingDialog"
import { TransportPanel } from "../TransportPanel/TransportPanel"
import { DropZone } from "./DropZone"

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
`

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(1.05);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`

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

const ViewContainer = styled.div<{ isTransitioning: boolean }>`
  position: ${({ isTransitioning }) =>
    isTransitioning ? "relative" : "static"};
  width: ${({ isTransitioning }) => (isTransitioning ? "100vw" : "100%")};
  height: ${({ isTransitioning }) => (isTransitioning ? "100vh" : "100%")};
  overflow: ${({ isTransitioning }) =>
    isTransitioning ? "hidden" : "visible"};
`

const AnimatedInitialView = styled.div<{ isExiting: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: ${({ isExiting }) => (isExiting ? 1 : 2)};
  animation: ${({ isExiting }) => (isExiting ? fadeOut : "none")} 0.4s
    cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: forwards;
  pointer-events: ${({ isExiting }) => (isExiting ? "none" : "auto")};
`

const AnimatedMainView = styled.div<{ isEntering: boolean }>`
  width: 100%;
  height: 100%;
  opacity: ${({ isEntering }) => (isEntering ? 0 : 1)};
  animation: ${({ isEntering }) => (isEntering ? fadeIn : "none")} 0.4s
    cubic-bezier(0.4, 0, 0.2, 1);
  animation-fill-mode: ${({ isEntering }) =>
    isEntering ? "forwards" : "none"};
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
  const { path, setPath } = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showInitialView, setShowInitialView] = useState(true)

  // Auto-redirect homepage to /arrange
  useEffect(() => {
    if (path === "/") {
      setPath("/arrange")
    }
  }, [path, setPath])

  // Check if song has any non-conductor tracks with note events (i.e., has musical content)
  const hasSongContent = useMemo(() => {
    return tracks.some(
      (track) =>
        !track.isConductorTrack &&
        track.events.some((e) => "subtype" in e && e.subtype === "note"),
    )
  }, [tracks])

  // Handle transition from initial view to main view
  useEffect(() => {
    if (!hasSongContent && path === "/") {
      // Reset to initial view state
      setShowInitialView(true)
      setIsTransitioning(false)
    } else if (
      (hasSongContent || path === "/arrange" || path === "/track") &&
      showInitialView
    ) {
      // Start transition when moving away from initial view
      setIsTransitioning(true)
      // After fade out completes, hide initial view
      const timer = setTimeout(() => {
        setShowInitialView(false)
        setIsTransitioning(false)
      }, 400) // Match animation duration
      return () => clearTimeout(timer)
    } else if (hasSongContent && (path === "/arrange" || path === "/track")) {
      // Ensure transition state is reset when switching between main views
      setShowInitialView(false)
      setIsTransitioning(false)
    }
  }, [hasSongContent, path, showInitialView])

  const shouldShowInitialView =
    !hasSongContent && path === "/" && showInitialView
  const shouldShowMainView =
    hasSongContent ||
    path === "/arrange" ||
    path === "/track" ||
    isTransitioning

  return (
    <>
      {shouldShowInitialView ? (
        <ViewContainer isTransitioning={isTransitioning}>
          <AnimatedInitialView isExiting={isTransitioning}>
            <InitialView />
          </AnimatedInitialView>
          {shouldShowMainView && (
            <AnimatedMainView isEntering={isTransitioning && showInitialView}>
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
            </AnimatedMainView>
          )}
        </ViewContainer>
      ) : (
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
      )}
      <HelpDialog />
      <ExportProgressDialog />
      <Head />
      <SettingDialog />
      <ControlSettingDialog />
      <OnInit />
      <OnBeforeUnload />
    </>
  )
}
