import styled from "@emotion/styled"

export const TextField = styled.input`
  display: block;
  appearance: none;
  border: none;
  background: inherit;
  border: 1px solid var(--color-divider);
  border-radius: 0.25rem;
  height: 3rem;
  padding: 0 1rem;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  color: inherit;
  font-size: 1rem;
  font-family: inherit;
  outline: none;

  &:focus {
    border-color: var(--color-theme);
  }
`
