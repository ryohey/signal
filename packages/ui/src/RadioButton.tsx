import styled from "@emotion/styled"
import CircleIcon from "mdi-react/CircleIcon"
import type { FC, ReactNode } from "react"

const Button = styled.div`
  display: inline-flex;
  width: 1.25rem;
  height: 1.25rem;
  border: 1px solid var(--color-divider);
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
`

const CheckIcon = styled(CircleIcon)`
  fill: var(--color-text);
  width: 0.7rem;
  height: 0.7rem;
`

const RowWrapper = styled.div`
  display: flex;
  padding: 0.5rem 0;
  align-items: flex-start;

  &:hover [data-radio-button] {
    border-color: var(--color-text-secondary);
  }
`

const RadioIndicator = styled.div`
  margin-top: 0.1rem;
  flex-shrink: 0;
`

const LabelGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 0.5rem;
`

const RowLabel = styled.span`
  font-size: 0.8rem;
  color: var(--color-text);
`

const RowDescription = styled.span`
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  opacity: 0.7;
  margin-top: 0.15rem;
`

export interface RadioButtonProps {
  label: ReactNode
  description?: ReactNode
  isSelected: boolean
  onClick: () => void
}

export const RadioButton: FC<RadioButtonProps> = ({
  label,
  description,
  isSelected,
  onClick,
}) => {
  return (
    <RowWrapper onClick={onClick}>
      <RadioIndicator>
        <Button data-radio-button>{isSelected && <CheckIcon />}</Button>
      </RadioIndicator>
      <LabelGroup>
        <RowLabel>{label}</RowLabel>
        {description && <RowDescription>{description}</RowDescription>}
      </LabelGroup>
    </RowWrapper>
  )
}
