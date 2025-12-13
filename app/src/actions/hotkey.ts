import {
  ControlEventsClipboardDataSchema,
  PianoNotesClipboardDataSchema,
} from "@signal-app/core"
import { useCopySelection, useDeleteSelection, usePasteSelection } from "."
import {
  useCopyControlSelection,
  useDeleteControlSelection,
  usePasteControlSelection,
} from "../actions/control"
import { useControlPane } from "../hooks/useControlPane"
import { usePianoRoll } from "../hooks/usePianoRoll"
import { useRouter } from "../hooks/useRouter"
import { readClipboardData } from "../services/Clipboard"
import {
  useArrangeCopySelection,
  useArrangeDeleteSelection,
  useArrangePasteSelection,
} from "./arrangeView"

export const useCopySelectionGlobal = () => {
  const { selectedNoteIds } = usePianoRoll()
  const { path } = useRouter()
  const { selectedEventIds: controlSelectedEventIds } = useControlPane()
  const copySelection = useCopySelection()
  const arrangeCopySelection = useArrangeCopySelection()
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
    }
  }
}

export const usePasteSelectionGlobal = () => {
  const { path } = useRouter()
  const pasteSelection = usePasteSelection()
  const arrangePasteSelection = useArrangePasteSelection()
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
    }
  }
}
