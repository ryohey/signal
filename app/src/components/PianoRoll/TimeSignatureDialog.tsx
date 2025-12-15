import styled from "@emotion/styled"
import { range } from "lodash"
import { FC, useEffect, useState } from "react"
import { Localized } from "../../localize/useLocalization"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { Button, PrimaryButton } from "../ui/Button"
import { Select } from "../ui/Select"
import { TextField } from "../ui/TextField"

export interface TimeSignatureDialogProps {
  initialNumerator?: number
  initialDenominator?: number
  open: boolean
  onClose: () => void
  onClickOK: (timeSignature: { numerator: number; denominator: number }) => void
}

const NumberInput = styled(TextField)`
  width: 3em;
  text-align: center;
  font-size: 1rem;
  padding: 0.2rem 0;

  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`

export const TimeSignatureDialog: FC<TimeSignatureDialogProps> = ({
  initialNumerator = 4,
  initialDenominator = 4,
  open,
  onClose,
  onClickOK,
}) => {
  const [numerator, setNumerator] = useState(initialNumerator)
  const [denominator, setDenominator] = useState(initialDenominator)

  useEffect(() => {
    // reset values when opening the dialog
    if (open) {
      setNumerator(initialNumerator)
      setDenominator(initialDenominator)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTitle>
        <Localized name="time-signature" />
      </DialogTitle>
      <DialogContent>
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            justifyContent: "center",
          }}
        >
          <NumberInput
            value={numerator}
            type="number"
            min={1}
            max={32}
            onChange={(e) => setNumerator(parseInt(e.target.value))}
            onBlur={() => setNumerator(Math.max(1, Math.min(32, numerator)))}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
          />
          <span
            style={{
              width: "3em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            /
          </span>
          <Select
            style={{
              minWidth: "5em",
            }}
            value={denominator.toString()}
            onChange={(e) => setDenominator(parseInt(e.target.value as string))}
          >
            {range(0, 6)
              .map((v) => Math.pow(2, v))
              .map((v) => (
                <option key={v} value={v.toString()}>
                  {v}
                </option>
              ))}
          </Select>
        </div>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={onClose}>
          <Localized name="cancel" />
        </Button>
        <PrimaryButton
          onClick={() => {
            onClickOK({ numerator, denominator })
            onClose()
          }}
          disabled={isNaN(numerator) && numerator <= 32 && numerator > 0}
        >
          <Localized name="ok" />
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  )
}
