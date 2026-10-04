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
  useArrangeCopySelection,
  useArrangeDeleteSelection,
  useArrangeDuplicateSelection,
  useArrangePasteSelection,
  useArrangeTransposeSelection,
} from "../hooks/arrangeView"
import { useArrangeEditor } from "../hooks/useArrangeEditor"
import { useArrangeView } from "../hooks/useArrangeView"

export const ArrangeContextMenu: FC<ContextMenuProps> = (props) => {
  const { selection, setOpenVelocityDialog, setOpenTransposeDialog } =
    useArrangeView()
  const arrangeEditor = useArrangeEditor()

  const arrangeCopySelection = useArrangeCopySelection()
  const arrangeDeleteSelection = useArrangeDeleteSelection()
  const arrangePasteSelection = useArrangePasteSelection()
  const arrangeDuplicateSelection = useArrangeDuplicateSelection()
  const arrangeTransposeSelection = useArrangeTransposeSelection()

  const isNoteSelected = useMemo(
    () => selection !== null && arrangeEditor.hasEventsInSelection(selection),
    [selection, arrangeEditor],
  )

  const onClickVelocity = useCallback(() => {
    setOpenVelocityDialog(true)
  }, [setOpenVelocityDialog])

  return (
    <ContextMenu {...props}>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
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
          arrangePasteSelection()
        }}
      >
        <Localized name="paste" />
        <HotKey>{envString.cmdOrCtrl}+V</HotKey>
      </MenuItem>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
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
          arrangeTransposeSelection(12)
        }}
        disabled={!isNoteSelected}
      >
        <Localized name="one-octave-up" />
      </MenuItem>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
          arrangeTransposeSelection(-12)
        }}
        disabled={!isNoteSelected}
      >
        <Localized name="one-octave-down" />
      </MenuItem>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
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
