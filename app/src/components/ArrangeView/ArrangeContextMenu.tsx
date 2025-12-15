import { FC, useCallback, useMemo } from "react"
import {
  useArrangeCopySelection,
  useArrangeDeleteSelection,
  useArrangeDuplicateSelection,
  useArrangePasteSelection,
  useArrangeTransposeSelection,
} from "../../actions"
import { useArrangeView } from "../../hooks/useArrangeView"
import { useCommands } from "../../hooks/useCommands"
import { envString } from "../../localize/envString"
import { Localized } from "../../localize/useLocalization"
import {
  ContextMenu,
  ContextMenuProps,
  ContextMenuHotKey as HotKey,
} from "../ContextMenu/ContextMenu"
import { MenuDivider, MenuItem } from "../ui/Menu"

export const ArrangeContextMenu: FC<ContextMenuProps> = (props) => {
  const { handleClose } = props
  const commands = useCommands()
  const { selection, setOpenVelocityDialog, setOpenTransposeDialog } =
    useArrangeView()

  const arrangeCopySelection = useArrangeCopySelection()
  const arrangeDeleteSelection = useArrangeDeleteSelection()
  const arrangePasteSelection = useArrangePasteSelection()
  const arrangeDuplicateSelection = useArrangeDuplicateSelection()
  const arrangeTransposeSelection = useArrangeTransposeSelection()

  const isNoteSelected = useMemo(
    () => selection !== null && commands.arrange.hasSelectionNotes(selection),
    [selection, commands],
  )

  const onClickVelocity = useCallback(() => {
    setOpenVelocityDialog(true)
    handleClose()
  }, [handleClose, setOpenVelocityDialog])

  return (
    <ContextMenu {...props}>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
          handleClose()
          arrangeCopySelection()
          arrangeDeleteSelection()
        }}
        disabled={!isNoteSelected}
      >
        <Localized name="cut" />
        <HotKey>{envString.cmdOrCtrl}+X</HotKey>
      </MenuItem>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
          handleClose()
          arrangeCopySelection()
        }}
        disabled={!isNoteSelected}
      >
        <Localized name="copy" />
        <HotKey>{envString.cmdOrCtrl}+C</HotKey>
      </MenuItem>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
          handleClose()
          arrangePasteSelection()
        }}
      >
        <Localized name="paste" />
        <HotKey>{envString.cmdOrCtrl}+V</HotKey>
      </MenuItem>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
          handleClose()
          arrangeDuplicateSelection()
        }}
        disabled={!isNoteSelected}
      >
        <Localized name="duplicate" />
        <HotKey>{envString.cmdOrCtrl}+D</HotKey>
      </MenuItem>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
          handleClose()
          arrangeDeleteSelection()
        }}
        disabled={!isNoteSelected}
      >
        <Localized name="delete" />
        <HotKey>Del</HotKey>
      </MenuItem>
      <MenuDivider />
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
          handleClose()
          arrangeTransposeSelection(12)
        }}
        disabled={!isNoteSelected}
      >
        <Localized name="one-octave-up" />
      </MenuItem>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
          handleClose()
          arrangeTransposeSelection(-12)
        }}
        disabled={!isNoteSelected}
      >
        <Localized name="one-octave-down" />
      </MenuItem>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
          handleClose()
          setOpenTransposeDialog(true)
        }}
        disabled={!isNoteSelected}
      >
        <Localized name="transpose" />
        <HotKey>T</HotKey>
      </MenuItem>
      <MenuItem onClick={onClickVelocity} disabled={!isNoteSelected}>
        <Localized name="velocity" />
      </MenuItem>
    </ContextMenu>
  )
}
