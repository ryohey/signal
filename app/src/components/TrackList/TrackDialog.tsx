import { range } from "lodash"
import { FC, useEffect, useState } from "react"
import { Localized } from "../../localize/useLocalization"
import Track from "../../track"
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
  track: Track
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

const MIDIInputSelect: FC<{
  channel: number | null
  onChange: (channel: number | null) => void
}> = ({ channel, onChange }) => {
  return (
    <Select
      value={channel ?? -1}
      onChange={(e) => {
        const value = parseInt(e.target.value as string)
        onChange(value === -1 ? null : value)
      }}
    >
      <option key={-1} value={-1}>
        <Localized name="midi-input-all" />
      </option>
      {range(0, 16).map((v) => (
        <option key={v} value={v.toString()}>
          {v + 1}
        </option>
      ))}
    </Select>
  )
}

export const TrackDialog: FC<TrackDialogProps> = ({ track, open, onClose }) => {
  const [name, setName] = useState(track.name)
  const [channel, setChannel] = useState(track.channel)
  const [midiInputChannel, setMIDIInputChannel] = useState(
    track.inputChannel?.value ?? null,
  )

  useEffect(() => {
    if (open) {
      setName(track.name)
      setChannel(track.channel)
      setMIDIInputChannel(track.inputChannel?.value ?? null)
    }
  }, [open])

  const onClickOK = () => {
    track.channel = channel
    track.setName(name ?? "")
    track.setInputChannel(midiInputChannel)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose} style={{ minWidth: "20rem" }}>
      <DialogTitle>
        <Localized name="track" />: <TrackName track={track} />
      </DialogTitle>
      <DialogContent
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <Label>
          <Localized name="track-name" />
          <TextField
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value as string)}
            style={{ width: "100%" }}
          />
        </Label>
        <Label>
          <Localized name="channel" />
          <ChannelSelect channel={channel} onChange={setChannel} />
        </Label>
        <Label>
          <Localized name="midi-input" />
          <MIDIInputSelect
            channel={midiInputChannel}
            onChange={setMIDIInputChannel}
          />
        </Label>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          <Localized name="cancel" />
        </Button>
        <PrimaryButton onClick={onClickOK}>
          <Localized name="ok" />
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  )
}
