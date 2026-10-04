import styled from "@emotion/styled"
import {
  Content,
  Portal,
  Provider,
  Root,
  type TooltipContentProps,
  type TooltipProviderProps,
  Trigger,
} from "@radix-ui/react-tooltip"
import Color from "color"
import type { FC, ReactNode } from "react"

export type TooltipProps = TooltipProviderProps & {
  title: ReactNode
  side?: TooltipContentProps["side"]
}

const StyledContent = styled(Content)`
  background: ${({ theme }) => Color(theme.backgroundColor).darken(0.2).hex()};
  color: var(--color-text-secondary);
  padding: 0.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1rem 3rem var(--color-shadow);
`

export const Tooltip: FC<TooltipProps> = ({
  children,
  title,
  side = "bottom",
  ...props
}) => {
  return (
    <Provider {...props}>
      <Root>
        <Trigger asChild>{children}</Trigger>
        <Portal>
          <StyledContent side={side} sideOffset={5}>
            {title}
          </StyledContent>
        </Portal>
      </Root>
    </Provider>
  )
}
