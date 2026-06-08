import {
  ControlEventsClipboardDataSchema,
  PianoNotesClipboardDataSchema,
} from "@signal-app/core"
import {
  useArrangeCopySelection,
  useArrangeDeleteSelection,
  useArrangePasteSelection,
} from "../features/arrange/hooks/arrangeView"
import {
  useCopyControlSelection,
  useDeleteControlSelection,
  usePasteControlSelection,
} from "../features/control-pane/hooks/control"
import { useControlPane } from "../features/control-pane/hooks/useControlPane"
import {
  useCopySelection,
  useDeleteSelection,
  usePasteSelection,
} from "../features/piano-roll/hooks/selection"
import { usePianoRoll } from "../features/piano-roll/hooks/usePianoRoll"
import { useRouter } from "../hooks/useRouter"
import { readClipboardData } from "../services/Clipboard"
import {
  useCopyTempoSelection,
  useDeleteTempoSelection,
  usePasteTempoSelection,
} from "./tempo"

export const useCopySelectionGlobal = () => {
  const { selectedNoteIds } = usePianoRoll()
  const { path } = useRouter()
  const { selectedEventIds: controlSelectedEventIds } = useControlPane()
  const copySelection = useCopySelection()
  const arrangeCopySelection = useArrangeCopySelection()
  const copyTempoSelection = useCopyTempoSelection()
  const copyControlSelection = useCopyControlSelection()

  return () => {
    switch (path) {
      case "/track":
        if (selectedNoteIds.length > 0) {
          copySelection()
        } else if (controlSelectedEventIds.length > 0) {
          copyControlSelection()
        }
        break
      case "/arrange":
        arrangeCopySelection()
        break
      case "/tempo":
        copyTempoSelection()
        break
    }
  }
}

export const useCutSelectionGlobal = () => {
  const { selectedNoteIds } = usePianoRoll()
  const { path } = useRouter()
  const { selectedEventIds: controlSelectedEventIds } = useControlPane()
  const copySelection = useCopySelection()
  const deleteSelection = useDeleteSelection()
  const arrangeCopySelection = useArrangeCopySelection()
  const arrangeDeleteSelection = useArrangeDeleteSelection()
  const copyTempoSelection = useCopyTempoSelection()
  const deleteTempoSelection = useDeleteTempoSelection()
  const copyControlSelection = useCopyControlSelection()
  const deleteControlSelection = useDeleteControlSelection()

  return () => {
    switch (path) {
      case "/track":
        if (selectedNoteIds.length > 0) {
          copySelection()
          deleteSelection()
        } else if (controlSelectedEventIds.length > 0) {
          copyControlSelection()
          deleteControlSelection()
        }
        break
      case "/arrange":
        arrangeCopySelection()
        arrangeDeleteSelection()
        break
      case "/tempo":
        copyTempoSelection()
        deleteTempoSelection()
        break
    }
  }
}

export const usePasteSelectionGlobal = () => {
  const { path } = useRouter()
  const pasteSelection = usePasteSelection()
  const arrangePasteSelection = useArrangePasteSelection()
  const pasteTempoSelection = usePasteTempoSelection()
  const pasteControlSelection = usePasteControlSelection()

  return async () => {
    switch (path) {
      case "/track": {
        const obj = await readClipboardData()
        if (!obj) {
          return
        }
        if (PianoNotesClipboardDataSchema.safeParse(obj).success) {
          pasteSelection()
        } else if (ControlEventsClipboardDataSchema.safeParse(obj).success) {
          pasteControlSelection()
        }
        break
      }
      case "/arrange":
        arrangePasteSelection()
        break
      case "/tempo":
        pasteTempoSelection()
    }
  }
}
