import { ContextMenu, ContextMenuProps, MenuItem } from "@signal-app/ui"
import { FC, useState } from "react"
import { Localized } from "../../../../localize/useLocalization"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { KeySignatureDialog } from "../dialogs/KeySignatureDialog"

export const PianoKeysContextMenu: FC<ContextMenuProps> = (props) => {
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
  }

  const onClickHideScale = () => {
    setKeySignature(null)
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
