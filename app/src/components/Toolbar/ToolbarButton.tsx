import styled from "@emotion/styled"
import { ComponentProps, forwardRef } from "react"

const _ToolbarButton = styled.button`
  -webkit-appearance: none;
  min-width: auto;
  padding: 0 0.8rem;
  color: var(--color-text);
  border: none;
  background: var(--color-background-dark);
  text-transform: none;
  height: 2rem;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  border-radius: 999px;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;

  &:hover {
    background: var(--color-highlight);
  }

  &[data-selected="true"] {
    color: var(--color-on-surface);
    background: var(--color-theme);
  }
`

export const ToolbarButton = forwardRef<
  HTMLButtonElement,
  React.PropsWithChildren<
    Omit<ComponentProps<typeof _ToolbarButton>, "tabIndex">
  > & { selected?: boolean }
>(({ children, onMouseDown, selected = false, ...props }, ref) => (
  <_ToolbarButton
    {...props}
    data-selected={selected}
    onMouseDown={(e) => {
      e.preventDefault()
      onMouseDown?.(e)
    }}
    tabIndex={-1}
    ref={ref}
  >
    {children}
  </_ToolbarButton>
))
