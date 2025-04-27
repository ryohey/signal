import { FC } from "react"
import {
  useDuplicateTrack,
  useInsertTrack,
  useRemoveTrack,
} from "../../actions"
import { useArrangeView } from "../../hooks/useArrangeView"
import { Localized } from "../../localize/useLocalization"
import { ContextMenu, ContextMenuProps } from "../ContextMenu/ContextMenu"
import { MenuItem } from "../ui/Menu"

export const ArrangeTrackContextMenu: FC<ContextMenuProps> = (props) => {
  const { handleClose } = props
  const { selectedTrackIndex, selectedTrackId, tracks } = useArrangeView()
  const insertTrack = useInsertTrack()
  const removeTrack = useRemoveTrack()
  const duplicateTrack = useDuplicateTrack()

  return (
    <ContextMenu {...props}>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
          insertTrack(selectedTrackIndex + 1)
          handleClose()
        }}
      >
        <Localized name="add-track" />
      </MenuItem>
      {selectedTrackIndex > 0 &&
        tracks.length > 2 &&
        selectedTrackId !== undefined && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation()
              removeTrack(selectedTrackId)
              handleClose()
            }}
          >
            <Localized name="delete-track" />
          </MenuItem>
        )}
      {selectedTrackIndex > 0 && selectedTrackId !== undefined && (
        <MenuItem
          onClick={(e) => {
            e.stopPropagation()
            duplicateTrack(selectedTrackId)
            handleClose()
          }}
        >
          <Localized name="duplicate-track" />
        </MenuItem>
      )}
    </ContextMenu>
  )
}
