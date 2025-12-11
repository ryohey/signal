import { TrackId } from "@signal-app/core"
import Color from "color"
import { FC, useCallback, useState } from "react"
import { useAddTrack, useRemoveTrack } from "../../actions"
import { useTrack } from "../../hooks/useTrack"
import { Localized } from "../../localize/useLocalization"
import { ColorPicker } from "../ColorPicker/ColorPicker"
import { ContextMenu, ContextMenuProps } from "../ContextMenu/ContextMenu"
import { MenuItem } from "../ui/Menu"
import { TrackDialog } from "./TrackDialog"
import { RegenerateDialog } from "./RegenerateDialog"

export interface TrackListContextMenuProps extends ContextMenuProps {
  trackId: TrackId
}

export const TrackListContextMenu: FC<TrackListContextMenuProps> = ({
  trackId,
  ...props
}) => {
  const { setColor, isConductorTrack } = useTrack(trackId)
  const addTrack = useAddTrack()
  const removeTrack = useRemoveTrack()

  const { handleClose } = props
  const [isDialogOpened, setDialogOpened] = useState(false)
  const [isColorPickerOpened, setColorPickerOpened] = useState(false)
  const [isRegenerateOpened, setRegenerateOpened] = useState(false)

  const onClickAdd = addTrack
  const onClickDelete = useCallback(
    () => removeTrack(trackId),
    [trackId, removeTrack],
  )
  const onClickProperty = () => setDialogOpened(true)
  const onClickChangeTrackColor = () => setColorPickerOpened(true)
  const onClickRegenerate = () => setRegenerateOpened(true)

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
            handleClose()
          }}
        >
          <Localized name="add-track" />
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation()
            onClickDelete()
            handleClose()
          }}
        >
          <Localized name="delete-track" />
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation()
            onClickProperty()
            handleClose()
          }}
        >
          <Localized name="property" />
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation()
            onClickChangeTrackColor()
            handleClose()
          }}
        >
          <Localized name="change-track-color" />
        </MenuItem>
        {!isConductorTrack && (
          <MenuItem
            onClick={(e) => {
              e.stopPropagation()
              onClickRegenerate()
              handleClose()
            }}
          >
            Regenerate with AI
          </MenuItem>
        )}
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
      <RegenerateDialog
        trackId={trackId}
        open={isRegenerateOpened}
        onClose={() => setRegenerateOpened(false)}
      />
    </>
  )
}
