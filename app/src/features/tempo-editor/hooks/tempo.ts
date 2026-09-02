import { ClipboardDataSchema } from "@signal-app/tempo-editor"
import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import {
  readClipboardData,
  readJSONFromClipboard,
  writeClipboardData,
} from "../../../services/Clipboard"
import { useTempoEditor, useTempoEditorService } from "./useTempoEditor"

export const useDeleteTempoSelection = () => {
  const tempoEditor = useTempoEditorService()
  const { pushHistory } = useHistory()
  const { selectedEventIds, setSelection } = useTempoEditor()

  return () => {
    if (selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    tempoEditor.removeItems(selectedEventIds)
    setSelection(null)
  }
}

export const useCopyTempoSelection = () => {
  const tempoEditor = useTempoEditorService()
  const { selectedEventIds } = useTempoEditor()

  return useCallback(async () => {
    const data = tempoEditor.getItemsClipboardData(selectedEventIds)
    if (!data) {
      return
    }
    await writeClipboardData(data)
  }, [tempoEditor, selectedEventIds])
}

export const usePasteTempoSelection = () => {
  const { position } = usePlayer()
  const { pushHistory } = useHistory()
  const tempoEditor = useTempoEditorService()

  return useCallback(
    async (e?: ClipboardEvent) => {
      const obj = e ? readJSONFromClipboard(e) : await readClipboardData()
      const { data } = ClipboardDataSchema.safeParse(obj)

      if (!data) {
        return
      }

      pushHistory()
      tempoEditor.pasteItemsAtPosition(data, position)
    },
    [pushHistory, tempoEditor, position],
  )
}

export const useCutTempoSelection = () => {
  const copyTempoSelection = useCopyTempoSelection()
  const deleteTempoSelection = useDeleteTempoSelection()

  return useCallback(() => {
    copyTempoSelection()
    deleteTempoSelection()
  }, [copyTempoSelection, deleteTempoSelection])
}

export const useDuplicateTempoSelection = () => {
  const tempoEditor = useTempoEditorService()
  const { pushHistory } = useHistory()
  const { selectedEventIds, setSelectedEventIds } = useTempoEditor()

  return () => {
    if (selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    const addedEventIds = tempoEditor.duplicateItems(selectedEventIds)

    // select the created events
    setSelectedEventIds(addedEventIds)
  }
}
