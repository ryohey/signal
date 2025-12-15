import styled from "@emotion/styled"

export const CircleButton = styled.div`
  --webkit-appearance: none;
  outline: none;
  border: none;
  border-radius: 0.5rem;
  margin: 0.125rem;
  padding: 0.5rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: var(--color-text);
    background: rgba(255, 255, 255, 0.08);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`
