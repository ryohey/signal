import { FC, useCallback } from "react"
import {
  useCopyControlSelection,
  useDeleteControlSelection,
  useDuplicateControlSelection,
  usePasteControlSelection,
} from "../../actions/control"
import { useControlPane } from "../../hooks/useControlPane"
import { envString } from "../../localize/envString"
import { Localized } from "../../localize/useLocalization"
import {
  ContextMenu,
  ContextMenuProps,
  ContextMenuHotKey as HotKey,
} from "../ContextMenu/ContextMenu"
import { MenuItem } from "../ui/Menu"

export const ControlSelectionContextMenu: FC<ContextMenuProps> = (props) => {
  const { handleClose } = props
  const { selectedEventIds } = useControlPane()
  const isEventSelected = selectedEventIds.length > 0
  const copyControlSelection = useCopyControlSelection()
  const deleteControlSelection = useDeleteControlSelection()
  const duplicateControlSelection = useDuplicateControlSelection()
  const pasteControlSelection = usePasteControlSelection()

  const onClickCut = useCallback(() => {
    copyControlSelection()
    deleteControlSelection()
    handleClose()
  }, [copyControlSelection, deleteControlSelection])

  const onClickCopy = useCallback(() => {
    copyControlSelection()
    handleClose()
  }, [copyControlSelection])

  const onClickPaste = useCallback(() => {
    pasteControlSelection()
    handleClose()
  }, [pasteControlSelection])

  const onClickDuplicate = useCallback(() => {
    duplicateControlSelection()
    handleClose()
  }, [duplicateControlSelection])

  const onClickDelete = useCallback(() => {
    deleteControlSelection()
    handleClose()
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
