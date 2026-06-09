import { DialogTitle } from "@radix-ui/react-dialog"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  PrimaryButton,
} from "@signal-app/ui"
import { FC } from "react"
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
        <Localized name="delete-account-description" />
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
