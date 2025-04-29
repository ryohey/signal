import styled from "@emotion/styled"

export const IconButton = styled.button`
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--color-highlight);
  }
`
