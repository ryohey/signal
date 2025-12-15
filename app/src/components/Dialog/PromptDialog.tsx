import { PromptContext, PromptProps } from "dialog-hooks"
import { FC, useContext, useState } from "react"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { Button } from "../ui/Button"
import { TextField } from "../ui/TextField"

export const PromptDialog: FC<PromptProps> = (props) => {
  const [input, setInput] = useState(props.initialText)
  const { setPrompt } = useContext(PromptContext)

  const close = () => {
    setPrompt(null)
  }

  const onCancel = () => {
    props.callback(null)
    close()
  }

  const onClickOK = () => {
    props.callback(input ?? null)
    close()
  }

  return (
    <Dialog open={true} onOpenChange={onCancel} style={{ width: "20rem" }}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <TextField
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus={true}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              onClickOK()
            }
          }}
          style={{ width: "100%" }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClickOK}>{props.okText ?? "OK"}</Button>
        <Button onClick={onCancel}>{props.cancelText ?? "Cancel"}</Button>
      </DialogActions>
    </Dialog>
  )
}
