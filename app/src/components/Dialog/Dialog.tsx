import { keyframes } from "@emotion/react"
import styled from "@emotion/styled"
import { composeEventHandlers } from "@radix-ui/primitive"
import {
  Content,
  DialogOverlay,
  DialogPortal,
  Overlay,
  Portal,
  type DialogProps as Props,
  Root,
} from "@radix-ui/react-dialog"
import {
  type ComponentPropsWithoutRef,
  type ElementRef,
  type FC,
  forwardRef,
  useRef,
} from "react"

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

// https://github.com/radix-ui/primitives/discussions/3319#discussioncomment-11844283
const FocusFixedDialogContent = forwardRef<
  ElementRef<typeof Content>,
  ComponentPropsWithoutRef<typeof Content>
>(({ ...props }, ref) => {
  const previousActiveElement = useRef<HTMLElement | null>(null)

  return (
    <DialogPortal>
      <DialogOverlay />
      <Content
        onOpenAutoFocus={composeEventHandlers(props.onOpenAutoFocus, () => {
          previousActiveElement.current = document.activeElement as HTMLElement
        })}
        onCloseAutoFocus={composeEventHandlers(props.onCloseAutoFocus, () => {
          // Return focus to the previously active element
          // Radix will immediately follow this callback and attempt to focus the DialogTrigger if it's provided
          previousActiveElement.current?.focus()
        })}
        ref={ref}
        {...props}
      />
    </DialogPortal>
  )
})

const StyledContent = styled(FocusFixedDialogContent)`
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
