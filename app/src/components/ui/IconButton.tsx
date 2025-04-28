import styled from "@emotion/styled"

export const IconButton = styled.button<{ active?: boolean }>`
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  background: none;
  color: ${({ theme, active }) =>
    active ? theme.textColor : theme.secondaryTextColor};
  cursor: pointer;

  &:hover {
    background: var(--color-highlight);
  }
`
