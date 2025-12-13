import { useToast } from "dialog-hooks"
import { type FC, useCallback } from "react"
import { useRootView } from "../../hooks/useRootView"
import { useLocalization } from "../../localize/useLocalization"
import { SignInDialogContent } from "./SignInDialogContent"

export const SignInDialog: FC = () => {
  const { openSignInDialog, setOpenSignInDialog } = useRootView()
  const toast = useToast()
  const localized = useLocalization()

  const onClose = useCallback(
    () => setOpenSignInDialog(false),
    [setOpenSignInDialog]
  )

  const signInSuccessWithAuthResult = async () => {
    setOpenSignInDialog(false)
    toast.success(localized["success-sign-in"])
  }

  const signInFailure = (error: firebaseui.auth.AuthUIError) => {
    console.warn(error)
  }

  return (
    <SignInDialogContent
      open={openSignInDialog}
      onClose={onClose}
      onSuccess={signInSuccessWithAuthResult}
      onFailure={signInFailure}
    />
  )
}
