import { FC } from "react"
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
import { MenuHotKey as HotKey, MenuDivider, MenuItem } from "../ui/Menu"

export const EditMenu: FC<{ close: () => void }> = ({ close }) => {
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

  const onClickUndo = async () => {
    close()
    await undo()
  }

  const onClickRedo = async () => {
    close()
    await redo()
  }

  const onClickCut = async () => {
    close()
    await copySelection()
    await deleteSelection()
  }

  const onClickCopy = async () => {
    close()
    await copySelection()
  }

  const onClickPaste = async () => {
    close()
    await pasteSelection()
  }

  const onClickDelete = async () => {
    close()
    await deleteSelection()
  }

  const onClickSelectAll = async () => {
    close()
    await selectAllNotes()
  }

  const onClickDuplicate = async () => {
    close()
    await duplicateSelection()
  }

  const onClickSelectNextNote = async () => {
    close()
    await selectNextNote()
  }

  const onClickSelectPreviousNote = async () => {
    close()
    await selectPreviousNote()
  }

  const onClickQuantizeSelectedNotes = async () => {
    close()
    await quantizeSelectedNotes()
  }

  const onClickTransposeUpOctave = async () => {
    close()
    await transposeSelection(12)
  }

  const onClickTransposeDownOctave = async () => {
    close()
    await transposeSelection(-12)
  }

  const onClickTranspose = () => {
    close()
    setOpenTransposeDialog(true)
  }

  const onClickVelocity = () => {
    close()
    setOpenVelocityDialog(true)
  }

  return (
    <>
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
    </>
  )
}
