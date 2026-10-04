import { useCallback, useMemo } from "react"
import { useKeyboardShortcut } from "../../../hooks/useKeyboardShortcut"
import { useSong } from "../../../hooks/useSong"
import { useTrackMute } from "../../../hooks/useTrackMute"
import { useSelectAllNotes } from "./selection"
import { useNoteCoordTransform } from "./useNoteCoordTransform"
import { usePianoRoll } from "./usePianoRoll"
import { useToggleGhost } from "./useToggleGhost"

const SCROLL_DELTA = 24

const useToggleMute = () => {
  const { toggleMute } = useTrackMute()
  const { selectedTrackId } = usePianoRoll()

  return useCallback(
    () => toggleMute(selectedTrackId),
    [toggleMute, selectedTrackId],
  )
}

const useToggleSolo = () => {
  const { toggleSolo } = useTrackMute()
  const { selectedTrackId } = usePianoRoll()

  return useCallback(
    () => toggleSolo(selectedTrackId),
    [toggleSolo, selectedTrackId],
  )
}

const useNextTrack = () => {
  const { selectedTrackIndex, setSelectedTrackIndex } = usePianoRoll()
  const { tracks } = useSong()

  return useCallback(() => {
    setSelectedTrackIndex(Math.min(selectedTrackIndex + 1, tracks.length - 1))
  }, [selectedTrackIndex, setSelectedTrackIndex, tracks.length])
}

const usePreviousTrack = () => {
  const { selectedTrackIndex, setSelectedTrackIndex } = usePianoRoll()

  return useCallback(() => {
    setSelectedTrackIndex(Math.max(selectedTrackIndex - 1, 1))
  }, [selectedTrackIndex, setSelectedTrackIndex])
}

export const usePianoRollKeyboardShortcut = () => {
  const { setMouseMode } = usePianoRoll()
  const { scrollBy } = useNoteCoordTransform()
  const selectAllNotes = useSelectAllNotes()
  const nextTrack = useNextTrack()
  const previousTrack = usePreviousTrack()
  const toggleSolo = useToggleSolo()
  const toggleMute = useToggleMute()
  const toggleGhost = useToggleGhost()

  const actions = useMemo(
    () => [
      {
        code: "ArrowUp",
        metaKey: true,
        run: () => scrollBy(0, SCROLL_DELTA),
      },
      {
        code: "ArrowDown",
        metaKey: true,
        run: () => scrollBy(0, -SCROLL_DELTA),
      },
      {
        code: "ArrowRight",
        metaKey: true,
        run: () => scrollBy(-SCROLL_DELTA, 0),
      },
      {
        code: "ArrowLeft",
        metaKey: true,
        run: () => scrollBy(SCROLL_DELTA, 0),
      },
      {
        code: "Digit1",
        run: () => setMouseMode("pencil"),
      },
      {
        code: "Digit2",
        run: () => setMouseMode("selection"),
      },
      {
        code: "KeyA",
        metaKey: true,
        run: selectAllNotes,
      },
      // Next track (S)
      { code: "KeyS", run: nextTrack },
      // Previous track (W)
      { code: "KeyW", run: previousTrack },
      // Toggle solo (N)
      { code: "KeyN", run: toggleSolo },
      // Toggle mute (M)
      { code: "KeyM", run: toggleMute },
      // Toggle ghost (,)
      { code: "Comma", run: toggleGhost },
    ],
    [
      scrollBy,
      setMouseMode,
      selectAllNotes,
      nextTrack,
      previousTrack,
      toggleSolo,
      toggleMute,
      toggleGhost,
    ],
  )

  return useKeyboardShortcut({
    actions,
  })
}
