import { FC } from "react"
import {
  useFastForwardOneBar,
  useNextTrack,
  usePreviousTrack,
  useRewindOneBar,
  useStop,
  useToggleGhost,
  useToggleMute,
  useToggleRecording,
  useToggleSolo,
} from "../../actions"
import { hasFSAccess } from "../../actions/file"
import { useDisableBounceScroll } from "../../hooks/useDisableBounceScroll"
import { useDisableBrowserContextMenu } from "../../hooks/useDisableBrowserContextMenu"
import { useDisableZoom } from "../../hooks/useDisableZoom"
import { useHistory } from "../../hooks/useHistory"
import { usePlayer } from "../../hooks/usePlayer"
import { useRootView } from "../../hooks/useRootView"
import { useRouter } from "../../hooks/useRouter"
import { useSong } from "../../hooks/useSong"
import { useSongFile } from "../../hooks/useSongFile"
import { useLocalization } from "../../localize/useLocalization"
import { fileInputID } from "../Navigation/LegacyFileMenu"
import { KeyboardShortcut } from "./KeyboardShortcut"

export const GlobalKeyboardShortcut: FC = () => {
  const { setOpenHelpDialog } = useRootView()
  const { setPath } = useRouter()
  const { playOrPause } = usePlayer()
  const { isSaved } = useSong()
  const rewindOneBar = useRewindOneBar()
  const fastForwardOneBar = useFastForwardOneBar()
  const stop = useStop()
  const nextTrack = useNextTrack()
  const previousTrack = usePreviousTrack()
  const toggleSolo = useToggleSolo()
  const toggleMute = useToggleMute()
  const toggleGhost = useToggleGhost()
  const toggleRecording = useToggleRecording()
  const { undo, redo } = useHistory()
  const { createNewSong, openSong, saveSong, saveAsSong, downloadSong } =
    useSongFile()
  const localized = useLocalization()
  useDisableZoom()
  useDisableBounceScroll()
  useDisableBrowserContextMenu()

  const openLegacy = async () => {
    if (isSaved || confirm(localized["confirm-open"])) {
      document.getElementById(fileInputID)?.click()
    }
  }

  return (
    <>
      <KeyboardShortcut
        actions={[
          // Play/Pause (Space)
          { code: "Space", run: playOrPause },
          // Undo (Meta-Z)
          {
            code: "KeyZ",
            metaKey: true,
            run: undo,
          },
          // Redo (Shift-Meta-Z)
          {
            code: "KeyZ",
            metaKey: true,
            shiftKey: true,
            run: redo,
          },
          // Redo (Meta-Y)
          { code: "KeyY", metaKey: true, run: redo },
          // Help (?)
          {
            code: "Slash",
            shiftKey: true,
            run: () => setOpenHelpDialog(true),
          },
          // Stop (Enter)
          { code: "Enter", run: stop },
          // Rewind one bar (A)
          { code: "KeyA", run: rewindOneBar },
          // Fast forward one bar (D)
          { code: "KeyD", run: fastForwardOneBar },
          // Next track (S)
          { code: "KeyS", run: nextTrack },
          // Previous track (W)
          { code: "KeyW", run: previousTrack },
          // Toggle solo (N)
          { code: "KeyN", run: toggleSolo },
          // Toggle mute (M)
          { code: "KeyM", run: toggleMute },
          // Toggle recording (R)
          { code: "KeyR", run: toggleRecording },
          // Toggle ghost (,)
          { code: "Comma", run: toggleGhost },
          // Switch to piano roll (Meta-1)
          {
            code: "Digit1",
            metaKey: true,
            run: () => setPath("/track"),
          },
          // Switch to arrange roll (Meta-2)
          {
            code: "Digit2",
            metaKey: true,
            run: () => setPath("/arrange"),
          },
          // Switch to tempo roll (Meta-3)
          {
            code: "Digit3",
            metaKey: true,
            run: () => setPath("/tempo"),
          },
          // Save (Meta-S)
          {
            code: "KeyS",
            metaKey: true,
            run: hasFSAccess ? saveSong : downloadSong,
          },
          // Save (Alt-S)
          {
            code: "KeyS",
            altKey: true,
            run: hasFSAccess ? saveSong : downloadSong,
          },
          // Save As (Shift-Meta-S)
          {
            code: "KeyS",
            shiftKey: true,
            metaKey: true,
            run: hasFSAccess ? saveAsSong : downloadSong,
          },
          // Save As (Shift-Alt-S)
          {
            code: "KeyS",
            shiftKey: true,
            altKey: true,
            run: hasFSAccess ? saveAsSong : downloadSong,
          },
          // Open (Meta-O)
          {
            code: "KeyO",
            metaKey: true,
            run: hasFSAccess ? openSong : openLegacy,
          },
          // Open (Alt-O)
          {
            code: "KeyO",
            altKey: true,
            run: hasFSAccess ? openSong : openLegacy,
          },
          // New (Meta-N)
          {
            code: "KeyN",
            metaKey: true,
            run: createNewSong,
          },
          // New (Alt-N)
          {
            code: "KeyN",
            altKey: true,
            run: createNewSong,
          },
        ]}
      />
    </>
  )
}
