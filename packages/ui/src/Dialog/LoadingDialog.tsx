import styled from "@emotion/styled"
import { FC, PropsWithChildren } from "react"
import { CircularProgress } from "../CircularProgress"
import { VisuallyHidden } from "../VisuallyHidden"
import { Dialog, DialogContent, DialogTitle } from "./Dialog"

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

export const LoadingDialog: FC<LoadingDialog> = ({ open, children }) => {
  return (
    <Dialog open={open} style={{ minWidth: "20rem" }}>
      <DialogContent style={{ display: "flex", marginBottom: "0" }}>
        <VisuallyHidden>
          <DialogTitle>Loading...</DialogTitle>
        </VisuallyHidden>
        <CircularProgress />
        <Message>{children}</Message>
      </DialogContent>
    </Dialog>
  )
}
