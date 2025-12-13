import { useMemo } from "react"
import {
  useNextTrack,
  usePreviousTrack,
  useSelectAllNotes,
  useToggleGhost,
  useToggleMute,
  useToggleSolo,
} from "../actions"
import { useKeyboardShortcut } from "./useKeyboardShortcut"
import { usePianoRoll } from "./usePianoRoll"

const SCROLL_DELTA = 24

export const usePianoRollKeyboardShortcut = () => {
  const { setMouseMode, scrollBy } = usePianoRoll()
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
    ]
  )

  return useKeyboardShortcut({
    actions,
  })
}
