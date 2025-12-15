import styled from "@emotion/styled"

const Container = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  pointer-events: none;
  background: black;
  color: #00ffd3;
  opacity: 0.5;
  z-index: 999999;
  padding: 0.25em 0.5em;
  font-size: 0.7rem;
  font-family: Consolas, monospace;
`

export const BuildInfo = () => {
  const env = process.env.NODE_ENV
  if (env === "production") {
    return <></>
  }
  return <Container>{env}</Container>
}
