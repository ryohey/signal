import { useCallback } from "react"
import { useRootView } from "../../hooks/useRootView"
import { Localized } from "../../localize/useLocalization"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { Button } from "../ui/Button"
import { CloudFileList } from "./CloudFileList"

export const CloudFileDialog = () => {
  const { openCloudFileDialog, setOpenCloudFileDialog } = useRootView()

  const onClose = useCallback(
    () => setOpenCloudFileDialog(false),
    [setOpenCloudFileDialog],
  )

  return (
    <Dialog
      open={openCloudFileDialog}
      onOpenChange={onClose}
      style={{ minWidth: "30rem" }}
    >
      <DialogTitle>
        <Localized name="files" />
      </DialogTitle>
      <DialogContent>
        <CloudFileList />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          <Localized name="close" />
        </Button>
      </DialogActions>
    </Dialog>
  )
}
