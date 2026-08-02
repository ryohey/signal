import {
  ContextMenu,
  ContextMenuProps,
  ContextMenuHotKey as HotKey,
  MenuItem,
} from "@signal-app/ui"
import { FC, useCallback } from "react"
import { envString } from "../../../localize/envString"
import { Localized } from "../../../localize/useLocalization"
import {
  useCopyControlSelection,
  useDeleteControlSelection,
  useDuplicateControlSelection,
  usePasteControlSelection,
} from "../hooks/control"
import { useControlPane } from "../hooks/useControlPane"

export const ControlSelectionContextMenu: FC<ContextMenuProps> = (props) => {
  const { selectedEventIds } = useControlPane()
  const isEventSelected = selectedEventIds.length > 0
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
    </ContextMenu>
  )
}
