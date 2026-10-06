import { ClipboardDataSchema, ValueEventType } from "@signal-app/control-editor"
import { Range } from "@signal-app/core"
import { useDialog } from "dialog-hooks"
import { useCallback } from "react"
import { useHistory } from "../../../hooks/useHistory"
import { usePlayer } from "../../../hooks/usePlayer"
import { useLocalization } from "../../../localize/useLocalization"
import {
  readClipboardData,
  readJSONFromClipboard,
  writeClipboardData,
} from "../../../services/Clipboard"
import { useControlEditor } from "./useControlEditor"
import { useControlPane } from "./useControlPane"

export const useCreateOrUpdateControlEventsValue = () => {
  const controlEditor = useControlEditor()
  const { position } = usePlayer()
  const { pushHistory } = useHistory()
  const { selectedEventIds } = useControlPane()

  return useCallback(
    (value: number) => {
      pushHistory()

      controlEditor.createOrUpdateItemValue(selectedEventIds, value, position)
    },
    [selectedEventIds, controlEditor, position, pushHistory],
  )
}

// value is in display units (e.g. pitch bend center is 0)
export const useUpdateControlEventsValue = () => {
  const controlEditor = useControlEditor()
  const { pushHistory } = useHistory()

  return useCallback(
    (eventIds: readonly number[], value: number) => {
      if (controlEditor.getItemsByIds(eventIds).length === 0) {
        return
      }

      pushHistory()
      controlEditor.createOrUpdateItemValue(
        eventIds,
        ValueEventType.fromDisplayValue(controlEditor.type, value),
        0,
      )
    },
    [controlEditor, pushHistory],
  )
}

// Removes every point of the current lane, after asking for confirmation
export const useClearControlEvents = () => {
  const controlEditor = useControlEditor()
  const { pushHistory } = useHistory()
  const { resetSelection } = useControlPane()
  const dialog = useDialog()
  const localized = useLocalization()

  return useCallback(async () => {
    const ids = controlEditor
      .getItemsInRangeWithPrevious(Range.create(0, Number.MAX_SAFE_INTEGER))
      .map((item) => item.id)
    if (ids.length === 0) {
      return
    }

    const result = await dialog.show({
      title: localized["control-clear-title"],
      message: localized["control-clear-message"],
      actions: [
        { title: localized["cancel"], key: "cancel" },
        { title: localized["control-clear-tool"], key: "clear" },
      ],
    })
    if (result !== "clear") {
      return
    }

    pushHistory()
    controlEditor.removeItems(ids)
    resetSelection()
  }, [controlEditor, dialog, localized, pushHistory, resetSelection])
}

export const useDeleteControlSelection = () => {
  const { pushHistory } = useHistory()
  const { selectedEventIds, setSelection } = useControlPane()
  const controlEditor = useControlEditor()

  return useCallback(() => {
    if (selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    controlEditor.removeItems(selectedEventIds)
    setSelection(null)
  }, [selectedEventIds, controlEditor, pushHistory, setSelection])
}

export const useCopyControlSelection = () => {
  const { selectedEventIds } = useControlPane()
  const controlEditor = useControlEditor()

  return useCallback(async () => {
    if (selectedEventIds.length === 0) {
      return
    }
    const data = controlEditor.getItemsClipboardData(selectedEventIds)
    if (!data) {
      return
    }

    await writeClipboardData(data)
  }, [selectedEventIds, controlEditor])
}

export const usePasteControlSelection = () => {
  const { position } = usePlayer()
  const { pushHistory } = useHistory()
  const controlEditor = useControlEditor()

  return useCallback(
    async (e?: ClipboardEvent) => {
      const obj = e ? readJSONFromClipboard(e) : await readClipboardData()
      const { data } = ClipboardDataSchema.safeParse(obj)

      if (
        !data ||
        !ValueEventType.equals(data.valueEventType, controlEditor.type)
      ) {
        return
      }

      pushHistory()
      controlEditor.pasteItemsAtPosition(data, position)
    },
    [controlEditor, position, pushHistory],
  )
}

export const useCutControlSelection = () => {
  const copyControlSelection = useCopyControlSelection()
  const deleteControlSelection = useDeleteControlSelection()

  return useCallback(() => {
    copyControlSelection()
    deleteControlSelection()
  }, [copyControlSelection, deleteControlSelection])
}

export const useDuplicateControlSelection = () => {
  const { pushHistory } = useHistory()
  const { selectedEventIds, setSelectedEventIds } = useControlPane()
  const controlEditor = useControlEditor()

  return useCallback(() => {
    if (selectedEventIds.length === 0) {
      return
    }

    pushHistory()

    // select the created events
    const addedEventIds = controlEditor.duplicateItems(selectedEventIds)
    setSelectedEventIds([...addedEventIds])
  }, [selectedEventIds, controlEditor, pushHistory, setSelectedEventIds])
}
