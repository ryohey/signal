import { useCallback } from "react"
import { useAutoSave } from "../../hooks/useAutoSave"
import { Localized } from "../../localize/useLocalization"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { Button, PrimaryButton } from "../ui/Button"

export interface AutoSaveDialogProps {
  open: boolean
  onClose: () => void
}

export const AutoSaveDialog: React.FC<AutoSaveDialogProps> = ({
  open,
  onClose,
}) => {
  const { restoreAutoSave, onUserExplicitAction, getLastSaveTime } = useAutoSave()
  const lastSaveTime = getLastSaveTime()

  const handleRestore = useCallback(() => {
    restoreAutoSave()
    onClose()
  }, [restoreAutoSave, onClose])

  const handleDiscard = useCallback(() => {
    onUserExplicitAction()
    onClose()
  }, [onUserExplicitAction, onClose])

  const formatTime = (date: Date) => {
    return date.toLocaleString()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTitle>
        <Localized name="auto-save-dialog-title" />
      </DialogTitle>
      <DialogContent>
        <Localized name="auto-save-dialog-description" />
        {lastSaveTime && (
          <p>
            <Localized name="auto-save-dialog-last-save-time" />{" "}
            {formatTime(lastSaveTime)}
          </p>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDiscard}>
          <Localized name="auto-save-dialog-delete" />
        </Button>
        <PrimaryButton onClick={handleRestore}>
          <Localized name="auto-save-dialog-restore" />
        </PrimaryButton>
      </DialogActions>
    </Dialog>
  )
}
