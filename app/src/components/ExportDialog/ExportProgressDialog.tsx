import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
} from "@signal-app/ui"
import { FC, useCallback } from "react"
import { useExport } from "../../hooks/useExport"
import { Localized } from "../../localize/useLocalization"

export const ExportProgressDialog: FC = () => {
  const {
    openExportProgressDialog: open,
    setOpenExportProgressDialog: setOpen,
    progress,
    cancelExport,
  } = useExport()

  const onClickCancel = useCallback(() => {
    setOpen(false)
    cancelExport()
  }, [setOpen, cancelExport])

  return (
    <Dialog open={open} style={{ minWidth: "20rem" }}>
      <DialogTitle>
        <Localized name="exporting-audio" />
      </DialogTitle>
      <DialogContent>
        <LinearProgress value={progress} max={1} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClickCancel}>
          <Localized name="cancel" />
        </Button>
      </DialogActions>
    </Dialog>
  )
}
