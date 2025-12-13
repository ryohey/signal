import styled from "@emotion/styled"
import { type FC, useState } from "react"
import "firebase/auth"
import { GithubAuthProvider, GoogleAuthProvider } from "firebase/auth"
import { auth } from "../firebase/firebase"
import { Localized } from "../localize/useLocalization"
import { SignInSuccessPage } from "./SignInSuccessPage"
import { StyledFirebaseAuth } from "./StyledFirebaseAuth"

const Title = styled.div`
  font-size: 1.25rem;
  color: var(--color-text);
  margin-bottom: 1.5rem;
`

const Content = styled.div`
  overflow-x: hidden;
  overflow-y: auto;
  margin-bottom: 1rem;
`

const Container = styled.div`
  padding: 2rem 3rem;
`

export const SignInPage: FC = () => {
  const [isSucceeded, setIsSucceeded] = useState(false)

  if (isSucceeded) {
    return <SignInSuccessPage />
  }

  return (
    <Container>
      <Title>
        <Localized name="sign-in" />
      </Title>
      <Content>
        <StyledFirebaseAuth
          uiConfig={{
            signInOptions: [
              GoogleAuthProvider.PROVIDER_ID,
              GithubAuthProvider.PROVIDER_ID,
              "apple.com",
            ],
            callbacks: {
              signInSuccessWithAuthResult: ({ credential }) => {
                const redirectUrl = new URLSearchParams(location.search).get(
                  "redirect_uri"
                )
                if (
                  redirectUrl &&
                  (redirectUrl.startsWith("jp.codingcafe.signal://") ||
                    redirectUrl.startsWith("jp.codingcafe.signal.dev://"))
                ) {
                  const url = `${redirectUrl}?credential=${JSON.stringify(credential)}`

                  try {
                    location.assign(url)
                    setIsSucceeded(true)
                  } catch {
                    alert("Failed to open the app. Please try again.")
                  }
                }
                return false
              },
              signInFailure(error) {
                console.error(error)
                alert("Failed to sign in. Please try again.")
              },
            },
            signInFlow: "popup",
          }}
          firebaseAuth={auth}
        />
      </Content>
    </Container>
  )
}
