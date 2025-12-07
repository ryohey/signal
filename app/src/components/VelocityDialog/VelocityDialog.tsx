import styled from "@emotion/styled"
import type { BatchUpdateOperation } from "@signal-app/core"
import { type FC, useCallback, useEffect, useState } from "react"
import { Localized } from "../../localize/useLocalization"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { Button } from "../ui/Button"
import { RadioButton } from "../ui/RadioButton"
import { StyledNumberInput } from "../ui/StyledNumberInput"

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Row = styled.div`
  display: flex;
  gap: 2rem;
`

export interface VelocityDialogProps {
  open: boolean
  value: number
  onClickOK: (
    value: number,
    operationType: BatchUpdateOperation["type"]
  ) => void
  onClose: () => void
}

export const VelocityDialog: FC<VelocityDialogProps> = ({
  open,
  value: initialValue,
  onClickOK,
  onClose,
}) => {
  const [operationType, setOperationType] =
    useState<BatchUpdateOperation["type"]>("set")
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (open) {
      setValue(initialValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const _onClickOK = useCallback(() => {
    onClickOK(value, operationType)
    onClose()
  }, [value, operationType, onClickOK, onClose])

  return (
    <Dialog open={open} style={{ minWidth: "20rem" }}>
      <DialogTitle>
        <Localized name="velocity" />
      </DialogTitle>
      <DialogContent>
        <Column>
          <StyledNumberInput
            value={value}
            onChange={setValue}
            style={{ flexGrow: 1 }}
            onEnter={_onClickOK}
            allowNegative={operationType === "add"}
          />
          <Row>
            <RadioButton
              label={<Localized name="operation-set" />}
              isSelected={operationType === "set"}
              onClick={() => setOperationType("set")}
            />
            <RadioButton
              label={<Localized name="operation-add" />}
              isSelected={operationType === "add"}
              onClick={() => setOperationType("add")}
            />
            <RadioButton
              label={<Localized name="operation-multiply" />}
              isSelected={operationType === "multiply"}
              onClick={() => setOperationType("multiply")}
            />
          </Row>
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
