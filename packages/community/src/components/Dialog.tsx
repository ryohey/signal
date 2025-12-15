import { keyframes } from "@emotion/react"
import styled from "@emotion/styled"
import {
  Content,
  Overlay,
  Portal,
  DialogProps as Props,
  Root,
} from "@radix-ui/react-dialog"
import { FC } from "react"

const overlayShow = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

const contentShow = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
`

const StyledOverlay = styled(Overlay)`
  background-color: rgba(0, 0, 0, 0.3);
  position: fixed;
  inset: 0;
  animation: ${overlayShow} 150ms cubic-bezier(0.16, 1, 0.3, 1);
`

const StyledContent = styled(Content)`
  background-color: var(--color-background);
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 3rem var(--color-shadow);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin-bottom: 1rem;
  max-width: 30rem;
  max-height: 85vh;
  padding: 1rem;
  animation: ${contentShow} 150ms cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  overflow: hidden;

  &:focus {
    outline: none;
  }
`

export type DialogProps = Props & {
  style?: React.CSSProperties
}

export const Dialog: FC<DialogProps> = ({ children, style, ...props }) => (
  <Root {...props}>
    <Portal>
      <StyledOverlay />
      <StyledContent style={style}>{children}</StyledContent>
    </Portal>
  </Root>
)

export const DialogTitle = styled.div`
  font-size: 1.25rem;
  color: var(--color-text);
  margin-bottom: 1.5rem;
`

export const DialogContent = styled.div`
  overflow-x: hidden;
  overflow-y: auto;
  margin-bottom: 1rem;
`

export const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;

  & > *:not(:last-child) {
    margin-right: 1rem;
  }
`
