import { ContextMenu, ContextMenuProps, MenuItem } from "@signal-app/ui"
import { FC } from "react"
import { useRemoveTrack } from "../../../actions"
import { useSong } from "../../../hooks/useSong"
import { Localized } from "../../../localize/useLocalization"
import { useArrangeView } from "../hooks/useArrangeView"
import { useDuplicateTrack } from "../hooks/useDuplicateTrack"
import { useInsertTrack } from "../hooks/useInsertTrack"

export const ArrangeTrackContextMenu: FC<ContextMenuProps> = (props) => {
  const { handleClose } = props
  const { selectedTrackIndex, selectedTrackId } = useArrangeView()
  const { tracks } = useSong()
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
