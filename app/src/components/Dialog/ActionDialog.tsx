import { DialogContext, DialogProps } from "dialog-hooks"
import { useContext } from "react"
import { Button } from "../ui/Button"
import { Dialog, DialogActions, DialogContent, DialogTitle } from "./Dialog"

export const ActionDialog = (props: DialogProps<any>) => {
  const { setDialog } = useContext(DialogContext)

  const close = (key: any) => {
    props.callback(key)
    setDialog(null)
  }

  return (
    <Dialog
      open={true}
      onOpenChange={() => close(null)}
      style={{ minWidth: "20rem" }}
    >
      <DialogTitle>{props.title}</DialogTitle>
      {props.message && <DialogContent>{props.message}</DialogContent>}
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
