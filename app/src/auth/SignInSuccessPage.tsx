import styled from "@emotion/styled"
import type { FC } from "react"

const Container = styled.div`
  text-align: center;
  padding: 20px;
  border-radius: 10px;
  background-color: var(--color-background-dark);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 30rem;
  margin: 10rem auto;
`

const Title = styled.h1`
  color: var(--color-theme);
`

const Text = styled.p`
  color: var(--color-text-secondary);
`

export const SignInSuccessPage: FC = () => {
  return (
    <Container>
      <Title>Authentication Successful</Title>
      <Text>You may now close this page.</Text>
      <Text>Thank you for using signal.</Text>
    </Container>
  )
}
