import { FC, useState } from "react"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { Localized } from "../../localize/useLocalization"
import { ContextMenu, ContextMenuProps } from "../ContextMenu/ContextMenu"
import { KeySignatureDialog } from "../KeySignatureDialog/KeySignatureDialog"
import { MenuItem } from "../ui/Menu"

export const PianoKeysContextMenu: FC<ContextMenuProps> = (props) => {
  const { handleClose } = props
  const { keySignature, setKeySignature } = usePianoRoll()
  const [isKeySignatureDialogOpen, setKeySignatureDialogOpen] = useState(false)

  const onClickShowScale = () => {
    if (keySignature === null) {
      setKeySignature({
        scale: "major",
        key: 0,
      })
    }

    setKeySignatureDialogOpen(true)
    handleClose()
  }

  const onClickHideScale = () => {
    setKeySignature(null)
    handleClose()
  }

  return (
    <>
      <ContextMenu {...props}>
        <MenuItem onClick={onClickShowScale}>
          <Localized name="show-scale" />
        </MenuItem>
        <MenuItem onClick={onClickHideScale} disabled={keySignature === null}>
          <Localized name="hide-scale" />
        </MenuItem>
      </ContextMenu>
      <KeySignatureDialog
        open={isKeySignatureDialogOpen}
        onOpenChange={setKeySignatureDialogOpen}
      />
    </>
  )
}
