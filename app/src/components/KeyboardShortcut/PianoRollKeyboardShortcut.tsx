import { observer } from "mobx-react-lite"
import { FC } from "react"
import { usePasteSelection, useSelectAllNotes } from "../../actions"
import { usePasteControlSelection } from "../../actions/control"
import {
  isControlEventsClipboardData,
  isPianoNotesClipboardData,
} from "../../clipboard/clipboardTypes"
import { useControlPane } from "../../hooks/useControlPane"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import clipboard from "../../services/Clipboard"
import { KeyboardShortcut } from "./KeyboardShortcut"
import { useControlPaneKeyboardShortcutActions } from "./controlPaneKeyboardShortcutActions"
import { isFocusable } from "./isFocusable"
import { usePianoNotesKeyboardShortcutActions } from "./pianoNotesKeyboardShortcutActions"

const SCROLL_DELTA = 24

export const PianoRollKeyboardShortcut: FC = observer(() => {
  const { selectedNoteIds, scrollBy, setMouseMode } = usePianoRoll()
  const { selectedEventIds: controlSelectedEventIds } = useControlPane()
  const pianoNotesKeyboardShortcutActions =
    usePianoNotesKeyboardShortcutActions()
  const controlPaneKeyboardShortcutActions =
    useControlPaneKeyboardShortcutActions()
  const pasteSelection = usePasteSelection()
  const pasteControlSelection = usePasteControlSelection()
  const selectAllNotes = useSelectAllNotes()

  // Handle pasting here to allow pasting even when the element does not have focus, such as after clicking the ruler
  const onPaste = (e: ClipboardEvent) => {
    if (e.target !== null && isFocusable(e.target)) {
      return
    }

    const text = clipboard.readText()

    if (!text || text.length === 0) {
      return
    }

    const obj = JSON.parse(text)

    if (isPianoNotesClipboardData(obj)) {
      pasteSelection()
    } else if (isControlEventsClipboardData(obj)) {
      pasteControlSelection()
    }
  }

  return (
    <KeyboardShortcut
      actions={[
        ...(selectedNoteIds.length > 0
          ? pianoNotesKeyboardShortcutActions()
          : []),
        ...(controlSelectedEventIds.length > 0
          ? controlPaneKeyboardShortcutActions()
          : []),
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
      ]}
      onPaste={onPaste}
    />
  )
})
