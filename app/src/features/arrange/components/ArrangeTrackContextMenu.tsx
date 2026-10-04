import { ContextMenu, type ContextMenuProps, MenuItem } from "@signal-app/ui"
import type { FC } from "react"
import { useRemoveTrack } from "../../../actions"
import { Localized } from "../../../localize/useLocalization"
import { useArrangeTrackCount } from "../hooks/useArrangeTrackCount"
import { useArrangeView } from "../hooks/useArrangeView"
import { useDuplicateTrack } from "../hooks/useDuplicateTrack"
import { useInsertTrack } from "../hooks/useInsertTrack"

export const ArrangeTrackContextMenu: FC<ContextMenuProps> = (props) => {
  const { selectedTrackIndex, selectedTrackId } = useArrangeView()
  const trackCount = useArrangeTrackCount()
  const insertTrack = useInsertTrack()
  const removeTrack = useRemoveTrack()
  const duplicateTrack = useDuplicateTrack()

  return (
    <ContextMenu {...props}>
      <MenuItem
        onClick={(e) => {
          e.stopPropagation()
          insertTrack(selectedTrackIndex + 1)
        }}
      >
        <Localized name="add-track" />
      </MenuItem>
      {selectedTrackIndex > 0 &&
        trackCount > 2 &&
        selectedTrackId !== undefined && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation()
              removeTrack(selectedTrackId)
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
          }}
        >
          <Localized name="duplicate-track" />
        </MenuItem>
      )}
    </ContextMenu>
  )
}
