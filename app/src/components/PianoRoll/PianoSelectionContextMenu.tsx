import React, { FC } from "react"
import {
  useCopySelection,
  useDeleteSelection,
  useDuplicateSelection,
  usePasteSelection,
  useQuantizeSelectedNotes,
  useTransposeSelection,
} from "../../actions"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { envString } from "../../localize/envString"
import { Localized } from "../../localize/useLocalization"
import {
  ContextMenu,
  ContextMenuProps,
  ContextMenuHotKey as HotKey,
} from "../ContextMenu/ContextMenu"
import { MenuDivider, MenuItem } from "../ui/Menu"

export const PianoSelectionContextMenu: FC<ContextMenuProps> = React.memo(
  (props) => {
    const { handleClose } = props
    const { selectedNoteIds, setOpenTransposeDialog, setOpenVelocityDialog } =
      usePianoRoll()
    const isNoteSelected = selectedNoteIds.length > 0

    const copySelection = useCopySelection()
    const deleteSelection = useDeleteSelection()
    const pasteSelection = usePasteSelection()
    const duplicateSelection = useDuplicateSelection()
    const quantizeSelectedNotes = useQuantizeSelectedNotes()
    const transposeSelection = useTransposeSelection()

    const onClickCut = () => {
      copySelection()
      deleteSelection()
      handleClose()
    }

    const onClickCopy = () => {
      copySelection()
      handleClose()
    }

    const onClickPaste = () => {
      pasteSelection()
      handleClose()
    }

    const onClickDuplicate = () => {
      duplicateSelection()
      handleClose()
    }

    const onClickDelete = () => {
      deleteSelection()
      handleClose()
    }

    const onClickOctaveUp = () => {
      transposeSelection(12)
      handleClose()
    }

    const onClickOctaveDown = () => {
      transposeSelection(-12)
      handleClose()
    }

    const onClickQuantize = () => {
      quantizeSelectedNotes()
      handleClose()
    }

    const onClickTranspose = () => {
      setOpenTransposeDialog(true)
      handleClose()
    }

    const onClickVelocity = () => {
      setOpenVelocityDialog(true)
      handleClose()
    }

    return (
      <ContextMenu {...props}>
        <MenuItem onClick={onClickCut} disabled={!isNoteSelected}>
          <Localized name="cut" />
          <HotKey>{envString.cmdOrCtrl}+X</HotKey>
        </MenuItem>
        <MenuItem onClick={onClickCopy} disabled={!isNoteSelected}>
          <Localized name="copy" />
          <HotKey>{envString.cmdOrCtrl}+C</HotKey>
        </MenuItem>
        <MenuItem onClick={onClickPaste}>
          <Localized name="paste" />
          <HotKey>{envString.cmdOrCtrl}+V</HotKey>
        </MenuItem>
        <MenuItem onClick={onClickDuplicate} disabled={!isNoteSelected}>
          <Localized name="duplicate" />
          <HotKey>{envString.cmdOrCtrl}+D</HotKey>
        </MenuItem>
        <MenuItem onClick={onClickDelete} disabled={!isNoteSelected}>
          <Localized name="delete" />
          <HotKey>Del</HotKey>
        </MenuItem>
        <MenuDivider />
        <MenuItem onClick={onClickOctaveUp} disabled={!isNoteSelected}>
          <Localized name="one-octave-up" />
          <HotKey>Shift+↑</HotKey>
        </MenuItem>
        <MenuItem onClick={onClickOctaveDown} disabled={!isNoteSelected}>
          <Localized name="one-octave-down" />
          <HotKey>Shift+↓</HotKey>
        </MenuItem>
        <MenuItem onClick={onClickTranspose} disabled={!isNoteSelected}>
          <Localized name="transpose" />
          <HotKey>T</HotKey>
        </MenuItem>
        <MenuDivider />
        <MenuItem onClick={onClickQuantize} disabled={!isNoteSelected}>
          <Localized name="quantize" />
          <HotKey>Q</HotKey>
        </MenuItem>
        <MenuItem onClick={onClickVelocity} disabled={!isNoteSelected}>
          <Localized name="velocity" />
        </MenuItem>
      </ContextMenu>
    )
  },
)
