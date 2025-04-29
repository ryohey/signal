import styled from "@emotion/styled"
import { FC } from "react"

export const Toolbar: FC<React.PropsWithChildren<unknown>> = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  height: 3rem;
  box-sizing: border-box;

  background: var(--color-background);
`
