import { TrackId } from "@signal-app/core"
import { range } from "lodash"
import { FC, useEffect, useState } from "react"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../../../components/Dialog/Dialog"
import { Button, PrimaryButton } from "../../../components/ui/Button"
import { Label } from "../../../components/ui/Label"
import { Select } from "../../../components/ui/Select"
import { TextField } from "../../../components/ui/TextField"
import { useTrack } from "../../../hooks/useTrack"
import { Localized } from "../../../localize/useLocalization"
import { TrackName } from "./TrackName"

export interface TrackDialogProps {
  trackId: TrackId
  open: boolean
  onClose: () => void
}

const ChannelSelect: FC<{
  channel: number | undefined
  onChange: (channel: number) => void
}> = ({ channel, onChange }) => {
  return (
    <Select
      value={channel}
      onChange={(e) => onChange(parseInt(e.target.value as string))}
    >
      {range(0, 16).map((v) => (
        <option key={v} value={v.toString()}>
          {v + 1}
          {v === 9 ? (
            <>
              {" "}
              (<Localized name="rhythm-track" />)
            </>
          ) : (
            ""
          )}
        </option>
      ))}
    </Select>
  )
}

export const TrackDialog: FC<TrackDialogProps> = ({
  trackId,
  open,
  onClose,
}) => {
  const { name, channel, setName, setChannel } = useTrack(trackId)
  const [_name, _setName] = useState(name)
  const [_channel, _setChannel] = useState(channel)

  useEffect(() => {
    if (!open) {
      return
    }
    _setName(name)
    _setChannel(channel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId, open])

  return (
    <Dialog open={open} onOpenChange={onClose} style={{ minWidth: "20rem" }}>
      <DialogTitle>
        <Localized name="track" />: <TrackName trackId={trackId} />
      </DialogTitle>
      <DialogContent
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <Label>
          <Localized name="track-name" />
          <TextField
            type="text"
            value={_name}
            onChange={(e) => _setName(e.target.value as string)}
            style={{ width: "100%" }}
          />
        </Label>
        <Label>
          <Localized name="channel" />
          <ChannelSelect channel={_channel} onChange={_setChannel} />
        </Label>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          <Localized name="cancel" />
        </Button>
        <PrimaryButton
          onClick={() => {
            setName(_name ?? "")
            setChannel(_channel)
            onClose()
          }}
        >
          <Localized name="ok" />
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  )
}
