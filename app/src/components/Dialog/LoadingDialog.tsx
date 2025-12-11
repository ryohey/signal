import styled from "@emotion/styled"
import { DialogTitle } from "@radix-ui/react-dialog"
import { FC, PropsWithChildren } from "react"
import { CircularProgress } from "../ui/CircularProgress"
import { Dialog, DialogContent } from "./Dialog"

const Message = styled.div`
  color: var(--color-text);
  margin-left: 1rem;
  display: flex;
  align-items: center;
  font-size: 0.8rem;
`

export type LoadingDialog = PropsWithChildren<{
  open: boolean
}>

const VisuallyHiddenTitle = styled(DialogTitle)`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`

export const LoadingDialog: FC<LoadingDialog> = ({ open, children }) => {
  return (
    <Dialog open={open} style={{ minWidth: "20rem" }}>
      <VisuallyHiddenTitle>Loading</VisuallyHiddenTitle>
      <DialogContent style={{ display: "flex", marginBottom: "0" }}>
        <CircularProgress />
        <Message>{children}</Message>
      </DialogContent>
    </Dialog>
  )
}
