import styled from "@emotion/styled"

export const LinearProgress = styled.progress`
  width: 100%;
  -moz-appearance: none;
  -webkit-appearance: none;
  background: var(--color-background-secondary);

  &::-webkit-progress-bar {
    background: var(--color-background-secondary);
    border-radius: 0.25rem;
    height: 0.5rem;
  }

  &::-webkit-progress-value {
    background: var(--color-theme);
    border-radius: 0.25rem;
    height: 100%;
  }

  /* Firefox */
  border: none;
  border-radius: 0.25rem;
  height: 0.5rem;
  box-sizing: border-box;

  &::-moz-progress-bar {
    background: var(--color-theme);
    border-radius: 0.25rem;
    height: 100%;
  }
`
