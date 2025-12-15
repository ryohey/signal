import styled from "@emotion/styled"
import { ComponentProps, forwardRef } from "react"

const _ToolbarButton = styled.button`
  -webkit-appearance: none;
  min-width: auto;
  padding: 0 0.875rem;
  color: var(--color-text-secondary);
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.04);
  text-transform: none;
  height: 2rem;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 0.5rem;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.06);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  &[data-selected="true"] {
    color: var(--color-on-surface);
    background: var(--color-theme);
    border-color: var(--color-theme);
    box-shadow: 0 0 12px rgba(0, 212, 170, 0.3);
  }

  &[data-selected="true"]:hover {
    background: var(--color-theme);
    filter: brightness(1.1);
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
