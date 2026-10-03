import styled from "@emotion/styled"
import { FC, ReactNode, useCallback, useEffect, useState } from "react"
import { Localized } from "../../localize/useLocalization"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { Button } from "../ui/Button"
import { StyledNumberInput } from "../ui/StyledNumberInput"

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const RangeLabel = styled.div`
  font-size: 0.8rem;
  color: var(--color-text-secondary);
`

export interface ControlValueDialogProps {
  open: boolean
  title: ReactNode
  value: number
  minValue: number
  maxValue: number
  onClickOK: (value: number) => void
  onClose: () => void
}

export const ControlValueDialog: FC<ControlValueDialogProps> = ({
  open,
  title,
  value: initialValue,
  minValue,
  maxValue,
  onClickOK,
  onClose,
}) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (open) {
      setValue(initialValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const _onClickOK = useCallback(() => {
    onClickOK(value)
    onClose()
  }, [value, onClickOK, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose} style={{ minWidth: "20rem" }}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Column>
          <StyledNumberInput
            value={value}
            onChange={setValue}
            style={{ flexGrow: 1 }}
            onEnter={_onClickOK}
            allowNegative={minValue < 0}
          />
          <RangeLabel>
            {minValue} – {maxValue}
          </RangeLabel>
        </Column>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          <Localized name="cancel" />
        </Button>
        <Button onClick={_onClickOK}>
          <Localized name="ok" />
        </Button>
      </DialogActions>
    </Dialog>
  )
}
