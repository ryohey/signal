import styled from "@emotion/styled"
import { FC } from "react"
import { Scale } from "../../entities/scale/Scale"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { Localized } from "../../localize/useLocalization"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { Button } from "../ui/Button"
import { Label } from "../ui/Label"
import { Select } from "../ui/Select"
import { ScaleName } from "./ScaleName"

export interface KeySignatureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const keyNames = Array.from({ length: 12 }, (_, i) => {
  const names = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ]
  return names[i]
})

const Row = styled.div`
  display: flex;
  flex-direction: row;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
`

export const KeySignatureDialog: FC<KeySignatureDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { keySignature, setKeySignature } = usePianoRoll()
  const onClose = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onClose} style={{ minWidth: "20rem" }}>
      <DialogTitle>
        <Localized name="scale" />
      </DialogTitle>
      <DialogContent>
        <Row style={{ gap: "1rem" }}>
          <Column style={{ gap: "0.5rem", minWidth: "5rem" }}>
            <Label>
              <Localized name="key" />
            </Label>
            <Select
              value={keySignature?.key}
              onChange={(e) => {
                const key = parseInt(e.target.value, 10)
                setKeySignature({
                  scale: keySignature?.scale ?? "major",
                  key,
                })
              }}
            >
              {keyNames.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </Select>
          </Column>
          <Column style={{ gap: "0.5rem", minWidth: "5rem" }}>
            <Label>
              <Localized name="scale" />
            </Label>
            <Select
              value={keySignature?.scale}
              onChange={(e) => {
                const scale = e.target.value as Scale
                setKeySignature({
                  key: keySignature?.key ?? 0,
                  scale: scale,
                })
              }}
            >
              {Scale.values.map((name) => (
                <option key={name} value={name}>
                  <ScaleName scale={name} />
                </option>
              ))}
            </Select>
          </Column>
        </Row>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          <Localized name="close" />
        </Button>
      </DialogActions>
    </Dialog>
  )
}
