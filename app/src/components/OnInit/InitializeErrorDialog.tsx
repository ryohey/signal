import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@signal-app/ui"
import type { FC } from "react"
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
      <DialogContent>
        <DialogDescription>{message}</DialogDescription>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          <Localized name="close" />
        </Button>
      </DialogActions>
    </Dialog>
  )
}
