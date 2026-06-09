import styled from "@emotion/styled"
import ArrowDropDown from "mdi-react/ArrowDropDownIcon"
import { DetailedHTMLProps, FC } from "react"

const StyledSelect = styled.select`
  display: block;
  width: 100%;
  appearance: none;
  border: none;
  background: inherit;
  border: 1px solid var(--color-divider);
  border-radius: 0.25rem;
  height: 3rem;
  padding: 0 1rem;
  display: flex;
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

  option {
    color: var(--color-text);
    background: var(--color-background);
  }
`

const Arrow = styled(ArrowDropDown)`
  position: absolute;
  right: 0.5rem;
  top: 0.8rem;
  pointer-events: none;
`

const Wrapper = styled.div`
  position: relative;
`

export const Select: FC<
  DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  >
> = (props) => (
  <Wrapper>
    <StyledSelect {...props} />
    <Arrow />
  </Wrapper>
)
