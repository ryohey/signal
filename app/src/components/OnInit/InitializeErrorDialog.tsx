import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@signal-app/ui"
import { FC } from "react"
import { Localized } from "../../localize/useLocalization"

export interface InitializeErrorDialogProps {
  open: boolean
  message: string
  onClose: () => void
}

export const InitializeErrorDialog: FC<InitializeErrorDialogProps> = ({
  open,
  message,
  onClose,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTitle>
        <Localized name="initialize-error" />
      </DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          <Localized name="close" />
        </Button>
      </DialogActions>
    </Dialog>
  )
}
