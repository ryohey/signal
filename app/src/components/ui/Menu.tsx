import { keyframes } from "@emotion/react"
import styled from "@emotion/styled"
import {
  Content,
  Portal,
  Root,
  Sub,
  SubContent,
  SubTrigger,
  Trigger,
} from "@radix-ui/react-dropdown-menu"
import { FocusScope } from "@radix-ui/react-focus-scope"
import type React from "react"
import type { FC, PropsWithChildren } from "react"

export type MenuProps = PropsWithChildren<{
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger: React.ReactNode
}>

const StyledContent = styled(Content)`
  min-width: 8rem;
  background: var(--color-background-secondary);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 3rem var(--color-shadow);
  border: 1px solid var(--color-popup-border);
  margin: 0 1rem;
  padding: 0.5rem 0;
  outline: none;
`

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  outline: none;
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
          <FocusScope asChild>
            <List>{children}</List>
          </FocusScope>
        </StyledContent>
      </Portal>
    </Root>
  )
}

const StyledLi = styled.li`
  font-size: 0.8rem;
  color: var(--color-text);
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  cursor: pointer;

  &:hover {
    background: var(--color-highlight);
  }

  &[data-disabled="true"] {
    color: var(--color-text-secondary);
    pointer-events: none;

    &:hover {
      background: transparent;
    }
  }
`

export type MenuItemProps = React.DetailedHTMLProps<
  React.LiHTMLAttributes<HTMLLIElement>,
  HTMLLIElement
> & {
  disabled?: boolean
}

export const MenuItem: FC<MenuItemProps> = ({
  children,
  disabled = false,
  ...props
}) => (
  <StyledLi {...props} data-disabled={disabled}>
    {children}
  </StyledLi>
)

export const MenuDivider = styled.hr`
  border: none;
  border-top: 1px solid var(--color-divider);
`

const slideUpAndFade = keyframes`
	from {
		opacity: 0;
		transform: translateY(2px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
`

const slideRightAndFade = keyframes`
	from {
		opacity: 0;
		transform: translateX(-2px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
`

const slideDownAndFade = keyframes`
	from {
		opacity: 0;
		transform: translateY(-2px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
`

const slideLeftAndFade = keyframes`
	from {
		opacity: 0;
		transform: translateX(2px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
`

const StyledSubContent = styled(SubContent)`
  min-width: 8rem;
  border-radius: 6px;
  box-shadow:
    0px 10px 38px -10px rgba(22, 23, 24, 0.35),
    0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;

  &[data-side="top"] {
    animation-name: ${slideDownAndFade};
  }
  &[data-side="bottom"] {
    animation-name: ${slideUpAndFade};
  }
  $[data-side="left"] {
    animation-name: ${slideRightAndFade};
  }
  &[data-side="right"] {
    animation-name: ${slideLeftAndFade};
  }

  background: var(--color-background-secondary);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 3rem var(--color-shadow);
  border: 1px solid var(--color-popup-border);
  padding: 0.5rem 0;
`

const StyledSubTrigger = styled(SubTrigger)`
  outline: none;
`

// New SubMenu component using Radix's Sub, SubTrigger, and SubContent
export const SubMenu: FC<Pick<MenuProps, "trigger" | "children">> = ({
  trigger,
  children,
}) => {
  return (
    <Sub>
      <StyledSubTrigger>{trigger}</StyledSubTrigger>
      <Portal>
        <StyledSubContent sideOffset={-4} alignOffset={-4}>
          <List>{children}</List>
        </StyledSubContent>
      </Portal>
    </Sub>
  )
}

export const MenuHotKey = styled.div`
  font-size: 0.9em;
  flex-grow: 1;
  text-align: right;
  color: var(--color-text-secondary);
  margin-left: 2em;
`
