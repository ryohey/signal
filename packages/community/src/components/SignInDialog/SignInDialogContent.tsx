import styled from "@emotion/styled"
import type { FC } from "react"
import { Dialog, DialogActions, DialogContent, DialogTitle } from "../Dialog.js"
import "firebase/auth"
import { GithubAuthProvider, GoogleAuthProvider } from "firebase/auth"
import { auth } from "../../firebase/firebase.js"
import { Localized } from "../../localize/useLocalization.js"
import { Button } from "../Button.js"
import { StyledFirebaseAuth } from "../StyledFirebaseAuth.js"

const BetaLabel = styled.span`
  border: 1px solid currentColor;
  font-size: 0.8rem;
  padding: 0.1rem 0.4rem;
  margin-left: 1em;
  color: var(--color-text-secondary);
`

export interface SignInDialogContentProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  onFailure: (error: firebaseui.auth.AuthUIError) => void
}

export const SignInDialogContent: FC<SignInDialogContentProps> = ({
  open,
  onClose,
  onSuccess,
  onFailure,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose} style={{ minWidth: "20rem" }}>
      <DialogTitle>
        <Localized name="sign-in" />
        <BetaLabel>Beta</BetaLabel>
      </DialogTitle>
      <DialogContent>
        <StyledFirebaseAuth
          uiConfig={{
            signInOptions: [
              GoogleAuthProvider.PROVIDER_ID,
              GithubAuthProvider.PROVIDER_ID,
              "apple.com",
            ],
            callbacks: {
              signInSuccessWithAuthResult() {
                onSuccess()
                return false
              },
              signInFailure: onFailure,
            },
            signInFlow: "popup",
          }}
          firebaseAuth={auth}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          <Localized name="close" />
        </Button>
      </DialogActions>
    </Dialog>
  )
}
