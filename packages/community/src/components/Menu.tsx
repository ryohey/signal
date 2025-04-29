import styled from "@emotion/styled"
import { Content, Portal, Root, Trigger } from "@radix-ui/react-dropdown-menu"
import React, { FC, PropsWithChildren } from "react"

export type MenuProps = PropsWithChildren<{
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger: React.ReactNode
}>

const StyledContent = styled(Content)`
  background: var(--color-background-secondary);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 3rem var(--color-shadow);
  border: 1px solid var(--color-background);
  margin: 0 1rem;
  padding: 0.5rem 0;
`

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`

export const Menu: FC<MenuProps> = ({
  trigger,
  open,
  onOpenChange,
  children,
}) => {
  return (
    <Root open={open} onOpenChange={onOpenChange}>
      <Trigger asChild>{trigger}</Trigger>

      <Portal>
        <StyledContent>
          <List>{children}</List>
        </StyledContent>
      </Portal>
    </Root>
  )
}

const StyledLi = styled.li<{ disabled?: boolean }>`
  font-size: 0.8rem;
  color: ${({ theme, disabled }) =>
    disabled ? theme.secondaryTextColor : theme.textColor};
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  cursor: pointer;

  &:hover {
    background: ${({ theme, disabled }) =>
      disabled ? "transparent" : theme.highlightColor};
  }
`

export type MenuItemProps = React.DetailedHTMLProps<
  React.LiHTMLAttributes<HTMLLIElement>,
  HTMLLIElement
> & {
  disabled?: boolean
}

export const MenuItem: FC<MenuItemProps> = ({ children, ...props }) => (
  <StyledLi {...props}>{children}</StyledLi>
)

export const MenuDivider = styled.hr`
  border: none;
  border-top: 1px solid var(--color-divider);
`
