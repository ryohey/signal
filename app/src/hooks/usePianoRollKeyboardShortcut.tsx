import { useCallback, useMemo } from "react"
import { usePasteSelection, useSelectAllNotes } from "../actions"
import { usePasteControlSelection } from "../actions/control"
import {
  ControlEventsClipboardDataSchema,
  PianoNotesClipboardDataSchema,
} from "../clipboard/clipboardTypes"
import { isFocusable } from "../helpers/isFocusable"
import { readClipboardData } from "../services/Clipboard"
import { useKeyboardShortcut } from "./useKeyboardShortcut"
import { usePianoRoll } from "./usePianoRoll"

const SCROLL_DELTA = 24

export const usePianoRollKeyboardShortcut = () => {
  const { setMouseMode, scrollBy } = usePianoRoll()
  const pasteSelection = usePasteSelection()
  const pasteControlSelection = usePasteControlSelection()
  const selectAllNotes = useSelectAllNotes()

  // Handle pasting here to allow pasting even when the element does not have focus, such as after clicking the ruler
  const onPaste = useCallback(
    async (e: ClipboardEvent) => {
      if (e.target !== null && isFocusable(e.target)) {
        return
      }

      const obj = await readClipboardData()

      if (PianoNotesClipboardDataSchema.safeParse(obj).success) {
        pasteSelection(obj)
      } else if (ControlEventsClipboardDataSchema.safeParse(obj).success) {
        pasteControlSelection(obj)
      }
    },
    [pasteSelection, pasteControlSelection],
  )

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
    onPaste,
  })
}
