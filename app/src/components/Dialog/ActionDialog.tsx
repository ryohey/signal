import { DialogContext, DialogProps } from "dialog-hooks"
import { useContext } from "react"
import { Button } from "../ui/Button"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./Dialog"

export const ActionDialog = <T extends KeyType>(props: DialogProps<T>) => {
  const { setDialog } = useContext(DialogContext)

  const close = (key: T | null) => {
    props.callback(key)
    setDialog(null)
  }

  return (
    <Dialog
      open={true}
      onOpenChange={() => close(null)}
      style={{ minWidth: "20rem" }}
      // Opt out of aria-describedby when there is no message to describe
      {...(props.message ? {} : { "aria-describedby": undefined })}
    >
      <DialogTitle>{props.title}</DialogTitle>
      {props.message && (
        <DialogContent>
          <DialogDescription>{props.message}</DialogDescription>
        </DialogContent>
      )}
      <DialogActions>
        {props.actions.map((action) => (
          <Button key={action.key} onClick={() => close(action.key)}>
            {action.title}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  )
}
