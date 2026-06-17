import { MenuHotKey as HotKey, MenuDivider, MenuItem } from "@signal-app/ui"
import { FC, useCallback } from "react"
import { EditMenuPortal } from "../../../../components/Navigation/EditMenuPortal"
import { envString } from "../../../../localize/envString"
import { Localized } from "../../../../localize/useLocalization"
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
} from "../../hooks/selection"
import { usePianoRoll } from "../../hooks/usePianoRoll"

export const PianoRollEditMenu: FC = () => {
  const { selectedNoteIds, setOpenTransposeDialog, setOpenVelocityDialog } =
    usePianoRoll()
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

  const onClickCut = useCallback(async () => {
    await copySelection()
    deleteSelection()
  }, [copySelection, deleteSelection])

  const onClickCopy = useCallback(async () => {
    await copySelection()
  }, [copySelection])

  const onClickPaste = useCallback(async () => {
    await pasteSelection()
  }, [pasteSelection])

  const onClickDelete = useCallback(() => {
    deleteSelection()
  }, [deleteSelection])

  const onClickSelectAll = useCallback(() => {
    selectAllNotes()
  }, [selectAllNotes])

  const onClickDuplicate = useCallback(() => {
    duplicateSelection()
  }, [duplicateSelection])

  const onClickSelectNextNote = useCallback(() => {
    selectNextNote()
  }, [selectNextNote])

  const onClickSelectPreviousNote = useCallback(() => {
    selectPreviousNote()
  }, [selectPreviousNote])

  const onClickQuantizeSelectedNotes = useCallback(() => {
    quantizeSelectedNotes()
  }, [quantizeSelectedNotes])

  const onClickTransposeUpOctave = useCallback(() => {
    transposeSelection(12)
  }, [transposeSelection])

  const onClickTransposeDownOctave = useCallback(() => {
    transposeSelection(-12)
  }, [transposeSelection])

  const onClickTranspose = useCallback(() => {
    setOpenTransposeDialog(true)
  }, [setOpenTransposeDialog])

  const onClickVelocity = useCallback(() => {
    setOpenVelocityDialog(true)
  }, [setOpenVelocityDialog])

  return (
    <EditMenuPortal>
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
    </EditMenuPortal>
  )
}
