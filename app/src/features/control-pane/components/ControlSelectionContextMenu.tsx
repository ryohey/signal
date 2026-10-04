import {
  ContextMenu,
  type ContextMenuProps,
  ContextMenuHotKey as HotKey,
  MenuDivider,
  MenuItem,
} from "@signal-app/ui"
import { type FC, useCallback, useMemo } from "react"
import { envString } from "../../../localize/envString"
import { Localized } from "../../../localize/useLocalization"
import {
  useCopyControlSelection,
  useDeleteControlSelection,
  useDuplicateControlSelection,
  usePasteControlSelection,
} from "../hooks/control"
import { useControlPane } from "../hooks/useControlPane"

export type ControlSelectionContextMenuProps = ContextMenuProps & {
  // the event under the cursor when the menu was opened
  hitEventId: number | null
}

export const ControlSelectionContextMenu: FC<
  ControlSelectionContextMenuProps
> = ({ hitEventId, ...props }) => {
  const { handleClose } = props
  const { selectedEventIds, setValueDialogEventIds } = useControlPane()
  const isEventSelected = selectedEventIds.length > 0

  // Set Value edits the whole selection, unless the clicked point is outside it
  const valueTargetEventIds = useMemo(() => {
    if (hitEventId === null || selectedEventIds.includes(hitEventId)) {
      return selectedEventIds
    }
    return [hitEventId]
  }, [hitEventId, selectedEventIds])
  const copyControlSelection = useCopyControlSelection()
  const deleteControlSelection = useDeleteControlSelection()
  const duplicateControlSelection = useDuplicateControlSelection()
  const pasteControlSelection = usePasteControlSelection()

  const onClickCut = useCallback(() => {
    copyControlSelection()
    deleteControlSelection()
  }, [copyControlSelection, deleteControlSelection])

  const onClickCopy = useCallback(() => {
    copyControlSelection()
  }, [copyControlSelection])

  const onClickPaste = useCallback(() => {
    pasteControlSelection()
  }, [pasteControlSelection])

  const onClickDuplicate = useCallback(() => {
    duplicateControlSelection()
  }, [duplicateControlSelection])

  const onClickDelete = useCallback(() => {
    deleteControlSelection()
  }, [deleteControlSelection])

  const onClickSetValue = useCallback(() => {
    setValueDialogEventIds(valueTargetEventIds)
    handleClose()
  }, [setValueDialogEventIds, valueTargetEventIds, handleClose])

  return (
    <ContextMenu {...props}>
      <MenuItem onClick={onClickCut} disabled={!isEventSelected}>
        <Localized name="cut" />
        <HotKey>{envString.cmdOrCtrl}+X</HotKey>
      </MenuItem>
      <MenuItem onClick={onClickCopy} disabled={!isEventSelected}>
        <Localized name="copy" />
        <HotKey>{envString.cmdOrCtrl}+C</HotKey>
      </MenuItem>
      <MenuItem onClick={onClickPaste}>
        <Localized name="paste" />
        <HotKey>{envString.cmdOrCtrl}+V</HotKey>
      </MenuItem>
      <MenuItem onClick={onClickDuplicate} disabled={!isEventSelected}>
        <Localized name="duplicate" />
        <HotKey>{envString.cmdOrCtrl}+D</HotKey>
      </MenuItem>
      <MenuItem onClick={onClickDelete} disabled={!isEventSelected}>
        <Localized name="delete" />
        <HotKey>Del</HotKey>
      </MenuItem>
      <MenuDivider />
      <MenuItem
        onClick={onClickSetValue}
        disabled={valueTargetEventIds.length === 0}
      >
        <Localized name="set-value" />
      </MenuItem>
    </ContextMenu>
  )
}
