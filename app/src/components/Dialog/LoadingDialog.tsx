import styled from "@emotion/styled"
import { FC, PropsWithChildren } from "react"
import { CircularProgress } from "../ui/CircularProgress"
import { Dialog, DialogContent, DialogTitle } from "./Dialog"

// The message is the dialog's title for screen readers
const Message = styled(DialogTitle)`
  margin: 0 0 0 1rem;
  display: flex;
  align-items: center;
  font-size: 0.8rem;
`

export type LoadingDialog = PropsWithChildren<{
  open: boolean
}>

export const LoadingDialog: FC<LoadingDialog> = ({ open, children }) => {
  return (
    <Dialog
      open={open}
      style={{ minWidth: "20rem" }}
      aria-describedby={undefined}
    >
      <DialogContent style={{ display: "flex", marginBottom: "0" }}>
        <CircularProgress />
        <Message>{children}</Message>
      </DialogContent>
    </Dialog>
  )
}
