import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogTitle,
  PrimaryButton,
} from "@signal-app/ui"
import type { FC } from "react"
import { useRootView } from "../../hooks/useRootView"
import { Localized } from "../../localize/useLocalization"
import { userRepository } from "../../services/repositories"

export const DeleteAccountDialog: FC = () => {
  const { openDeleteAccountDialog, setOpenDeleteAccountDialog } = useRootView()

  const onClickCancel = () => {
    setOpenDeleteAccountDialog(false)
  }

  const onClickDelete = async () => {
    try {
      await userRepository.delete()
      setOpenDeleteAccountDialog(false)
    } catch (e) {
      alert(`Failed to delete account: ${e}`)
    }
  }

  return (
    <Dialog open={openDeleteAccountDialog}>
      <DialogTitle>
        <Localized name="delete-account" />
      </DialogTitle>
      <DialogContent>
        <DialogDescription>
          <Localized name="delete-account-description" />
        </DialogDescription>
      </DialogContent>
      <DialogActions>
        <PrimaryButton onClick={onClickDelete}>
          <Localized name="delete" />
        </PrimaryButton>
        <Button onClick={onClickCancel}>
          <Localized name="cancel" />
        </Button>
      </DialogActions>
    </Dialog>
  )
}
