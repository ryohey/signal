import type { FC } from "react"
import { LoadingDialog } from "./LoadingDialog"

export const ProgressDialog: FC<{ open: boolean; message: string }> = ({
  open,
  message,
}) => {
  return <LoadingDialog open={open}>{message}</LoadingDialog>
}
