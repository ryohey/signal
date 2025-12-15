import { css, keyframes } from "@emotion/react"
import styled from "@emotion/styled"
import {
  Content,
  Portal,
  Provider,
  Root,
  TooltipContentProps,
  TooltipProviderProps,
  Trigger,
} from "@radix-ui/react-tooltip"
import { FC, ReactNode } from "react"

export type TooltipProps = TooltipProviderProps & {
  title: ReactNode
  side?: TooltipContentProps["side"]
}

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`

const StyledContent = styled(Content)`
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: rgba(255, 255, 255, 0.95);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  animation: ${slideIn} 150ms cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: var(--radix-tooltip-content-transform-origin);
  z-index: 9999;
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
          <StyledContent side={side} sideOffset={8}>
            {title}
          </StyledContent>
        </Portal>
      </Root>
    </Provider>
  )
}
