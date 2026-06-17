import styled from "@emotion/styled"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Label,
  Select,
} from "@signal-app/ui"
import React, { FC } from "react"
import { ScaleName } from "../../../../components/KeySignatureDialog/ScaleName"
import { Scale } from "../../../../entities/scale/Scale"
import { Localized } from "../../../../localize/useLocalization"
import { usePianoRoll } from "../../hooks/usePianoRoll"

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

const _KeySignatureDialog: FC<KeySignatureDialogProps> = ({
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

export const KeySignatureDialog = React.memo(_KeySignatureDialog)
