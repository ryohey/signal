import { type FC, useCallback, useState } from "react"
import {
  useCopySelection,
  useDeleteSelection,
  useDuplicateSelection,
  usePasteSelection,
  useQuantizeSelectedNotes,
  useSelectAllNotes,
  useSelectNextNote,
  useSelectPreviousNote,
  useTransposeSelection,
} from "../../actions"
import { useHistory } from "../../hooks/useHistory"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { envString } from "../../localize/envString"
import { Localized } from "../../localize/useLocalization"
import { MenuHotKey as HotKey, Menu, MenuDivider, MenuItem } from "../ui/Menu"

export interface EditMenuProps {
  trigger: React.ReactNode
}

export const EditMenu: FC<EditMenuProps> = ({ trigger }) => {
  const { selectedNoteIds, setOpenTransposeDialog, setOpenVelocityDialog } =
    usePianoRoll()
  const { hasUndo, hasRedo, undo, redo } = useHistory()
  const copySelection = useCopySelection()
  const pasteSelection = usePasteSelection()
  const deleteSelection = useDeleteSelection()
  const duplicateSelection = useDuplicateSelection()
  const selectAllNotes = useSelectAllNotes()
  const selectNextNote = useSelectNextNote()
  const selectPreviousNote = useSelectPreviousNote()
  const quantizeSelectedNotes = useQuantizeSelectedNotes()
  const transposeSelection = useTransposeSelection()
  const anySelectedNotes = selectedNoteIds.length > 0
  const [isOpen, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  const onClickUndo = useCallback(() => {
    close()
    undo()
  }, [close, undo])

  const onClickRedo = useCallback(() => {
    close()
    redo()
  }, [close, redo])

  const onClickCut = useCallback(async () => {
    close()
    await copySelection()
    deleteSelection()
  }, [close, copySelection, deleteSelection])

  const onClickCopy = useCallback(async () => {
    close()
    await copySelection()
  }, [close, copySelection])

  const onClickPaste = useCallback(async () => {
    close()
    await pasteSelection()
  }, [close, pasteSelection])

  const onClickDelete = useCallback(async () => {
    close()
    deleteSelection()
  }, [close, deleteSelection])

  const onClickSelectAll = useCallback(() => {
    close()
    selectAllNotes()
  }, [close, selectAllNotes])

  const onClickDuplicate = useCallback(() => {
    close()
    duplicateSelection()
  }, [close, duplicateSelection])

  const onClickSelectNextNote = useCallback(() => {
    close()
    selectNextNote()
  }, [close, selectNextNote])

  const onClickSelectPreviousNote = useCallback(() => {
    close()
    selectPreviousNote()
  }, [close, selectPreviousNote])

  const onClickQuantizeSelectedNotes = useCallback(() => {
    close()
    quantizeSelectedNotes()
  }, [close, quantizeSelectedNotes])

  const onClickTransposeUpOctave = useCallback(() => {
    close()
    transposeSelection(12)
  }, [close, transposeSelection])

  const onClickTransposeDownOctave = useCallback(() => {
    close()
    transposeSelection(-12)
  }, [close, transposeSelection])

  const onClickTranspose = useCallback(() => {
    close()
    setOpenTransposeDialog(true)
  }, [close, setOpenTransposeDialog])

  const onClickVelocity = useCallback(() => {
    close()
    setOpenVelocityDialog(true)
  }, [close, setOpenVelocityDialog])

  return (
    <Menu open={isOpen} onOpenChange={setOpen} trigger={trigger}>
      <MenuItem onClick={onClickUndo} disabled={!hasUndo}>
        <Localized name="undo" />
        <HotKey>{envString.cmdOrCtrl}+Z</HotKey>
      </MenuItem>

      <MenuItem onClick={onClickRedo} disabled={!hasRedo}>
        <Localized name="redo" />
        <HotKey>{envString.cmdOrCtrl}+Shift+Z</HotKey>
      </MenuItem>

      <MenuDivider />

      <MenuItem onClick={onClickCut} disabled={!anySelectedNotes}>
        <Localized name="cut" />
        <HotKey>{envString.cmdOrCtrl}+X</HotKey>
      </MenuItem>

      <MenuItem onClick={onClickCopy} disabled={!anySelectedNotes}>
        <Localized name="copy" />
        <HotKey>{envString.cmdOrCtrl}+C</HotKey>
      </MenuItem>

      <MenuItem onClick={onClickPaste}>
        <Localized name="paste" />
        <HotKey>{envString.cmdOrCtrl}+V</HotKey>
      </MenuItem>

      <MenuItem onClick={onClickDelete} disabled={!anySelectedNotes}>
        <Localized name="delete" />
        <HotKey>Delete</HotKey>
      </MenuItem>

      <MenuItem onClick={onClickDuplicate} disabled={!anySelectedNotes}>
        <Localized name="duplicate" />
        <HotKey>{envString.cmdOrCtrl}+D</HotKey>
      </MenuItem>

      <MenuDivider />

      <MenuItem onClick={onClickSelectAll}>
        <Localized name="select-all" />
        <HotKey>{envString.cmdOrCtrl}+A</HotKey>
      </MenuItem>

      <MenuItem onClick={onClickSelectNextNote} disabled={!anySelectedNotes}>
        <Localized name="select-next" />
        <HotKey>→</HotKey>
      </MenuItem>

      <MenuItem
        onClick={onClickSelectPreviousNote}
        disabled={!anySelectedNotes}
      >
        <Localized name="select-previous" />
        <HotKey>←</HotKey>
      </MenuItem>

      <MenuDivider />

      <MenuItem onClick={onClickTransposeUpOctave} disabled={!anySelectedNotes}>
        <Localized name="one-octave-up" />
        <HotKey>Shift+↑</HotKey>
      </MenuItem>

      <MenuItem
        onClick={onClickTransposeDownOctave}
        disabled={!anySelectedNotes}
      >
        <Localized name="one-octave-down" />
        <HotKey>Shift+↓</HotKey>
      </MenuItem>

      <MenuItem onClick={onClickTranspose} disabled={!anySelectedNotes}>
        <Localized name="transpose" />
        <HotKey>T</HotKey>
      </MenuItem>

      <MenuDivider />

      <MenuItem
        onClick={onClickQuantizeSelectedNotes}
        disabled={!anySelectedNotes}
      >
        <Localized name="quantize" />
        <HotKey>Q</HotKey>
      </MenuItem>

      <MenuItem onClick={onClickVelocity} disabled={!anySelectedNotes}>
        <Localized name="velocity" />
      </MenuItem>
    </Menu>
  )
}
