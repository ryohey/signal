import styled from "@emotion/styled"
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

export const LoadingDialog: FC<LoadingDialog> = ({ open, children }) => {
  return (
    <Dialog open={open} style={{ minWidth: "20rem" }}>
      <DialogContent style={{ display: "flex", marginBottom: "0" }}>
        <CircularProgress />
        <Message>{children}</Message>
      </DialogContent>
    </Dialog>
  )
}
