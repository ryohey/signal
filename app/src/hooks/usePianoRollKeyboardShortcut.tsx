import { useMemo } from "react"
import { useSelectAllNotes } from "../actions"
import { useKeyboardShortcut } from "./useKeyboardShortcut"
import { usePianoRoll } from "./usePianoRoll"

const SCROLL_DELTA = 24

export const usePianoRollKeyboardShortcut = () => {
  const { setMouseMode, scrollBy } = usePianoRoll()
  const selectAllNotes = useSelectAllNotes()

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
    ],
    [scrollBy, setMouseMode, selectAllNotes],
  )

  return useKeyboardShortcut({
    actions,
  })
}
