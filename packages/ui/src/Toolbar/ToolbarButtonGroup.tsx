import styled from "@emotion/styled"
import { type ComponentProps, forwardRef } from "react"

export const ToolbarButtonGroup = styled.div`
  min-width: auto;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
`

const _ToolbarButtonGroupItem = styled.button`
  outline: none;
  -webkit-appearance: none;
  min-width: auto;
  padding: 0 0.5rem;
  color: var(--color-text);
  background: var(--color-background-dark);
  text-transform: none;
  height: 2rem;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin: 0;

  border: none;
  border-radius: 4px;

  &:first-of-type {
    border-radius: 4px 0 0 4px;
  }

  &:last-child {
    border-radius: 0 4px 4px 0;
  }

  &:hover {
    background: var(--color-highlight);
  }

  &[data-selected="true"] {
    color: var(--color-on-surface);
    background: var(--color-theme);
  }
`

export const ToolbarButtonGroupItem = forwardRef<
  HTMLButtonElement,
  React.PropsWithChildren<
    Omit<ComponentProps<typeof _ToolbarButtonGroupItem>, "tabIndex">
  > & { selected?: boolean }
>(({ children, onMouseDown, selected = false, ...props }, ref) => (
  <_ToolbarButtonGroupItem
    {...props}
    onMouseDown={(e) => {
      e.preventDefault()
      onMouseDown?.(e)
    }}
    data-selected={selected}
    tabIndex={-1}
    ref={ref}
  >
    {children}
  </_ToolbarButtonGroupItem>
))
