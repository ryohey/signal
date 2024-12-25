import styled from "@emotion/styled"

export const Label = styled.label`
  display: block;
  color: ${({ theme }) => theme.secondaryTextColor};
  font-size: 0.8rem;
  font-family: inherit;

  & > * {
    margin-top: 0.2rem;
  }
`
