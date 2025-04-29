import styled from "@emotion/styled"

export const TextArea = styled.textarea`
  display: block;
  appearance: none;
  border: none;
  background: inherit;
  border: 1px solid var(--color-divider);
  border-radius: 0.25rem;
  min-height: 8em;
  padding: 1rem 1rem;
  align-items: center;
  justify-content: center;
  color: inherit;
  font-size: 1rem;
  font-family: inherit;
  outline: none;

  &:focus {
    border-color: var(--color-theme);
  }
`
