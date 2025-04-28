import styled from "@emotion/styled"
import Color from "color"

export const Button = styled.button`
  display: flex;
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 0.2rem;
  color: var(--color-text);
  padding: 0.5rem 1rem;
  cursor: pointer;
  height: 2rem;
  outline: none;
  font-size: 0.8rem;

  &:hover {
    background: var(--color-highlight);
  }
  &:active {
    background: ${({ theme }) =>
      Color(theme.secondaryBackgroundColor).lighten(0.1).hex()};
  }
`

export const PrimaryButton = styled(Button)`
  background: var(--color-theme);
  color: var(--color-on-surface);

  &:hover {
    background: ${({ theme }) => Color(theme.themeColor).darken(0.1).hex()};
  }
  &:active {
    background: ${({ theme }) => Color(theme.themeColor).darken(0.2).hex()};
  }
`
