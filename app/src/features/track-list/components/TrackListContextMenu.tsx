import { TrackId } from "@signal-app/core"
import { ContextMenu, ContextMenuProps, MenuItem } from "@signal-app/ui"
import Color from "color"
import { FC, useCallback, useState } from "react"
import { useRemoveTrack } from "../../../actions"
import { ColorPicker } from "../../../components/ColorPicker/ColorPicker"
import { useTrack } from "../../../hooks/useTrack"
import { Localized } from "../../../localize/useLocalization"
import { useTrackList } from "../hooks/useTrackList"
import { TrackDialog } from "./TrackDialog"

export interface TrackListContextMenuProps extends ContextMenuProps {
  trackId: TrackId
}

export const TrackListContextMenu: FC<TrackListContextMenuProps> = ({
  trackId,
  ...props
}) => {
  const { setColor } = useTrack(trackId)
  const { addTrack } = useTrackList()
  const removeTrack = useRemoveTrack()

  const [isDialogOpened, setDialogOpened] = useState(false)
  const [isColorPickerOpened, setColorPickerOpened] = useState(false)

  const onClickAdd = addTrack
  const onClickDelete = useCallback(
    () => removeTrack(trackId),
    [trackId, removeTrack],
  )
  const onClickProperty = () => setDialogOpened(true)
  const onClickChangeTrackColor = () => setColorPickerOpened(true)

  const onPickColor = (color: string | null) => {
    if (color === null) {
      setColor(null)
      return
    }
    const obj = Color(color)
    setColor({
      red: Math.floor(obj.red()),
      green: Math.floor(obj.green()),
      blue: Math.floor(obj.blue()),
      alpha: 0xff,
    })
  }

  return (
    <>
      <ContextMenu {...props}>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation()
            onClickAdd()
          }}
        >
          <Localized name="add-track" />
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation()
            onClickDelete()
          }}
        >
          <Localized name="delete-track" />
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation()
            onClickProperty()
          }}
        >
          <Localized name="property" />
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation()
            onClickChangeTrackColor()
          }}
        >
          <Localized name="change-track-color" />
        </MenuItem>
      </ContextMenu>
      <TrackDialog
        trackId={trackId}
        open={isDialogOpened}
        onClose={() => setDialogOpened(false)}
      />
      <ColorPicker
        open={isColorPickerOpened}
        onSelect={onPickColor}
        onClose={() => setColorPickerOpened(false)}
      />
    </>
  )
}
