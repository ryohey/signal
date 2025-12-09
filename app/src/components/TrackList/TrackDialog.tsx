import type { TrackId } from "@signal-app/core"
import { range } from "lodash"
import { type FC, useEffect, useState } from "react"
import { useTrack } from "../../hooks/useTrack"
import { Localized } from "../../localize/useLocalization"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { Button, PrimaryButton } from "../ui/Button"
import { Label } from "../ui/Label"
import { Select } from "../ui/Select"
import { TextField } from "../ui/TextField"
import { TrackName } from "./TrackName"

export interface TrackDialogProps {
  trackId: TrackId
  open: boolean
  onClose: () => void
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
      <DialogContent>
        <Label>
          <Localized name="track-name" />
        </Label>
        <TextField
          type="text"
          value={_name}
          onChange={(e) => _setName(e.target.value as string)}
          style={{ width: "100%", marginBottom: "1rem" }}
        />
        <Label>
          <Localized name="channel" />
        </Label>
        <Select
          value={_channel}
          onChange={(e) => _setChannel(parseInt(e.target.value as string, 10))}
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
