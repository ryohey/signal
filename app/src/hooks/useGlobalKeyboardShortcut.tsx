import { useCallback, useMemo } from "react"
import { useFastForwardOneBar, useRewindOneBar, useStop } from "../actions"
import { hasFSAccess } from "../actions/file"
import { fileInputID } from "../components/Navigation/LegacyFileMenu"
import { useCloudFile } from "../features/cloud-file/hooks/useCloudFile"
import { useLocalization } from "../localize/useLocalization"
import { useAuth } from "./useAuth"
import { useHistory } from "./useHistory"
import { useKeyboardShortcut } from "./useKeyboardShortcut"
import { usePlayer } from "./usePlayer"
import { useRootView } from "./useRootView"
import { useRouter } from "./useRouter"
import { useSong } from "./useSong"
import { useSongFile } from "./useSongFile"
import { useToggleRecording } from "./useToggleRecording"

export const useGlobalKeyboardShortcut = () => {
  const { authUser } = useAuth()
  const { setOpenHelpDialog } = useRootView()
  const { setPath } = useRouter()
  const { playOrPause } = usePlayer()
  const { isSaved } = useSong()
  const rewindOneBar = useRewindOneBar()
  const fastForwardOneBar = useFastForwardOneBar()
  const stop = useStop()
  const toggleRecording = useToggleRecording()
  const { undo, redo } = useHistory()
  const { createNewSong, openSong, saveSong, saveAsSong, downloadSong } =
    useSongFile()
  const {
    openSong: openCloudSong,
    saveSong: saveCloudSong,
    saveAsSong: saveCloudAsSong,
  } = useCloudFile()
  const localized = useLocalization()

  const openLegacy = useCallback(async () => {
    if (isSaved || confirm(localized["confirm-open"])) {
      document.getElementById(fileInputID)?.click()
    }
  }, [isSaved, localized])

  const handleOpen = useCallback(async () => {
    if (authUser) {
      await openCloudSong()
    } else if (hasFSAccess) {
      await openSong()
    } else {
      await openLegacy()
    }
  }, [authUser, openCloudSong, openSong, openLegacy])

  const handleSave = useCallback(async () => {
    if (authUser) {
      await saveCloudSong()
    } else if (hasFSAccess) {
      await saveSong()
    } else {
      await downloadSong()
    }
  }, [authUser, saveCloudSong, saveSong, downloadSong])

  const handleSaveAs = useCallback(async () => {
    if (authUser) {
      await saveCloudAsSong()
    } else if (hasFSAccess) {
      await saveAsSong()
    } else {
      await downloadSong()
    }
  }, [authUser, saveCloudAsSong, saveAsSong, downloadSong])

  const actions = useMemo(
    () => [
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
      // Toggle recording (R)
      { code: "KeyR", run: toggleRecording },
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
        run: handleSave,
      },
      // Save (Alt-S)
      {
        code: "KeyS",
        altKey: true,
        run: handleSave,
      },
      // Save As (Shift-Meta-S)
      {
        code: "KeyS",
        shiftKey: true,
        metaKey: true,
        run: handleSaveAs,
      },
      // Save As (Shift-Alt-S)
      {
        code: "KeyS",
        shiftKey: true,
        altKey: true,
        run: handleSaveAs,
      },
      // Open (Meta-O)
      {
        code: "KeyO",
        metaKey: true,
        run: handleOpen,
      },
      // Open (Alt-O)
      {
        code: "KeyO",
        altKey: true,
        run: handleOpen,
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
    ],
    [
      playOrPause,
      undo,
      redo,
      setOpenHelpDialog,
      stop,
      rewindOneBar,
      fastForwardOneBar,
      toggleRecording,
      setPath,
      createNewSong,
      handleOpen,
      handleSave,
      handleSaveAs,
    ],
  )

  return useKeyboardShortcut({
    actions,
  })
}
