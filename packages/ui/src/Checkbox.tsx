import styled from "@emotion/styled"
import { type CheckboxProps, Indicator, Root } from "@radix-ui/react-checkbox"
import Check from "mdi-react/CheckIcon"
import type { FC, ReactNode } from "react"
import { Label } from "./Label"

const StyledRoot = styled(Root)`
  border: 1px solid var(--color-divider);
  background-color: var(--color-background);
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: var(--color-text-secondary);
  }
`

const StyledIndicator = styled(Indicator)`
  display: flex;
  align-items: center;
  justify-content: center;
`

const CheckIcon = styled(Check)`
  fill: var(--color-text);
  width: 1rem;
  height: 1rem;
`

const Title = styled.span`
  margin-left: 0.5rem;
`

export const Checkbox: FC<CheckboxProps & { label?: ReactNode }> = ({
  label,
  style,
  ...props
}) => (
  <Label style={{ display: "flex", alignItems: "center", ...style }}>
    <StyledRoot {...props}>
      <StyledIndicator>
        <CheckIcon />
      </StyledIndicator>
    </StyledRoot>
    <Title>{label}</Title>
  </Label>
)
