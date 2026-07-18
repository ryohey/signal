import {
  ContextMenu,
  ContextMenuProps,
  ContextMenuHotKey as HotKey,
  MenuDivider,
  MenuItem,
} from "@signal-app/ui"
import React, { FC, useCallback } from "react"
import { envString } from "../../../../localize/envString"
import { Localized } from "../../../../localize/useLocalization"
import {
  useCopySelection,
  useDeleteSelection,
  useDuplicateSelection,
  usePasteSelection,
  useQuantizeSelectedNotes,
  useTransposeSelection,
} from "../../hooks/selection"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { usePianoRollVelocityDialog } from "../../hooks/usePianoRollVelocityDialog"

export const PianoSelectionContextMenu: FC<ContextMenuProps> = React.memo(
  (props) => {
    const { handleClose } = props
    const { selectedNoteIds, setOpenTransposeDialog } = usePianoRoll()
    const { setOpen: setOpenVelocityDialog } = usePianoRollVelocityDialog()
    const isNoteSelected = selectedNoteIds.length > 0

    const copySelection = useCopySelection()
    const deleteSelection = useDeleteSelection()
    const pasteSelection = usePasteSelection()
    const duplicateSelection = useDuplicateSelection()
    const quantizeSelectedNotes = useQuantizeSelectedNotes()
    const transposeSelection = useTransposeSelection()

    const onClickCut = useCallback(() => {
      copySelection()
      deleteSelection()
      handleClose()
    }, [copySelection, deleteSelection, handleClose])

    const onClickCopy = useCallback(() => {
      copySelection()
      handleClose()
    }, [copySelection, handleClose])

    const onClickPaste = useCallback(() => {
      pasteSelection()
      handleClose()
    }, [pasteSelection, handleClose])

    const onClickDuplicate = useCallback(() => {
      duplicateSelection()
      handleClose()
    }, [duplicateSelection, handleClose])

    const onClickDelete = useCallback(() => {
      deleteSelection()
      handleClose()
    }, [deleteSelection, handleClose])

    const onClickOctaveUp = useCallback(() => {
      transposeSelection(12)
      handleClose()
    }, [transposeSelection, handleClose])

    const onClickOctaveDown = useCallback(() => {
      transposeSelection(-12)
      handleClose()
    }, [transposeSelection, handleClose])

    const onClickQuantize = useCallback(() => {
      quantizeSelectedNotes()
      handleClose()
    }, [quantizeSelectedNotes, handleClose])

    const onClickTranspose = useCallback(() => {
      setOpenTransposeDialog(true)
      handleClose()
    }, [setOpenTransposeDialog, handleClose])

    const onClickVelocity = useCallback(() => {
      setOpenVelocityDialog(true)
      handleClose()
    }, [setOpenVelocityDialog, handleClose])

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
