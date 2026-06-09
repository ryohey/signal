import styled from "@emotion/styled"
import Color from "color"
import ChevronDown from "mdi-react/ChevronDownIcon"
import type { FC, ReactNode } from "react"
import { PrimaryButton } from "./Button"
import { Menu, MenuItem } from "./Menu"

const DropdownButtonContainer = styled.div`
  position: relative;
  display: inline-flex;
`

const DropdownButtonMain = styled(PrimaryButton)`
  border-radius: 0.2rem 0 0 0.2rem;
  border-right: 1px solid ${({ theme }) => Color(theme.themeColor).darken(0.3).hex()};
`

const DropdownButtonChevron = styled(PrimaryButton)`
  border-radius: 0 0.2rem 0.2rem 0;
  padding: 0.5rem;
  min-width: 2rem;
  justify-content: center;
`

export interface DropdownAction {
  label: ReactNode
  onClick: () => void
  disabled?: boolean
}

export interface DropdownButtonProps {
  children: ReactNode
  actions: DropdownAction[]
  onClick?: () => void
  disabled?: boolean
}

export const DropdownButton: FC<DropdownButtonProps> = ({
  children,
  actions,
  onClick,
  disabled = false,
}) => {
  return (
    <DropdownButtonContainer>
      <DropdownButtonMain onClick={onClick} disabled={disabled}>
        {children}
      </DropdownButtonMain>
      <Menu
        trigger={
          <DropdownButtonChevron disabled={disabled}>
            <ChevronDown style={{ width: "1rem", height: "1rem" }} />
          </DropdownButtonChevron>
        }
      >
        {actions.map((action, index) => (
          <MenuItem
            key={`${action.label}-${index}`}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </DropdownButtonContainer>
  )
}
