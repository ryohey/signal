import {
  arrangeCopySelection,
  arrangeDeleteSelection,
  arrangePasteSelection,
} from "../actions/arrangeView"
import {
  copyControlSelection,
  deleteControlSelection,
  pasteControlSelection,
} from "../actions/control"
import {
  useCopySelection,
  useDeleteSelection,
  usePasteSelection,
} from "../actions/selection"
import {
  copyTempoSelection,
  deleteTempoSelection,
  pasteTempoSelection,
} from "../actions/tempo"
import {
  isControlEventsClipboardData,
  isPianoNotesClipboardData,
} from "../clipboard/clipboardTypes"
import { useStores } from "../hooks/useStores"
import Clipboard from "../services/Clipboard"

export const useCopySelectionGlobal = () => {
  const rootStore = useStores()
  const copySelection = useCopySelection()
  return () => {
    switch (rootStore.router.path) {
      case "/track":
        if (rootStore.pianoRollStore.selectedNoteIds.length > 0) {
          copySelection()
        } else if (rootStore.controlStore.selectedEventIds.length > 0) {
          copyControlSelection(rootStore)()
        }
        break
      case "/arrange":
        arrangeCopySelection(rootStore)()
        break
      case "/tempo":
        copyTempoSelection(rootStore)()
        break
    }
  }
}

export const useCutSelectionGlobal = () => {
  const rootStore = useStores()
  const copySelection = useCopySelection()
  const deleteSelection = useDeleteSelection()

  return () => {
    switch (rootStore.router.path) {
      case "/track":
        if (rootStore.pianoRollStore.selectedNoteIds.length > 0) {
          copySelection()
          deleteSelection()
        } else if (rootStore.controlStore.selectedEventIds.length > 0) {
          copyControlSelection(rootStore)()
          deleteControlSelection(rootStore)()
        }
        break
      case "/arrange":
        arrangeCopySelection(rootStore)()
        arrangeDeleteSelection(rootStore)()
        break
      case "/tempo":
        copyTempoSelection(rootStore)()
        deleteTempoSelection(rootStore)()
        break
    }
  }
}

export const usePasteSelectionGlobal = () => {
  const rootStore = useStores()
  const pasteSelection = usePasteSelection()
  return () => {
    switch (rootStore.router.path) {
      case "/track":
        const text = Clipboard.readText()
        if (!text || text.length === 0) {
          return
        }
        const obj = JSON.parse(text)
        if (isPianoNotesClipboardData(obj)) {
          pasteSelection()
        } else if (isControlEventsClipboardData(obj)) {
          pasteControlSelection(rootStore)()
        }
        break
      case "/arrange":
        arrangePasteSelection(rootStore)()
        break
      case "/tempo":
        pasteTempoSelection(rootStore)()
    }
  }
}
