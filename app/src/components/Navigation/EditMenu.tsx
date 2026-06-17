import { MenuHotKey as HotKey, Menu, MenuItem } from "@signal-app/ui"
import React, { FC, useCallback, useState } from "react"
import { useHistory } from "../../hooks/useHistory"
import { envString } from "../../localize/envString"
import { Localized } from "../../localize/useLocalization"
import { useEditMenuChildren } from "./EditMenuPortal"

export interface EditMenuProps {
  trigger: React.ReactNode
}

const _EditMenu: FC<EditMenuProps> = ({ trigger }) => {
  const { hasUndo, undo, hasRedo, redo } = useHistory()
  const editMenuChildren = useEditMenuChildren()
  const [isOpen, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  const onClickUndo = useCallback(() => {
    close()
    undo()
  }, [close, undo])

  const onClickRedo = useCallback(() => {
    close()
    redo()
  }, [close, redo])

  return (
    <Menu open={isOpen} onOpenChange={setOpen} trigger={trigger}>
      <MenuItem onClick={onClickUndo} disabled={!hasUndo}>
        <Localized name="undo" />
        <HotKey>{envString.cmdOrCtrl}+Z</HotKey>
      </MenuItem>

      <MenuItem onClick={onClickRedo} disabled={!hasRedo}>
        <Localized name="redo" />
        <HotKey>{envString.cmdOrCtrl}+Shift+Z</HotKey>
      </MenuItem>

      {editMenuChildren.map((entry) => (
        <React.Fragment key={entry.id}>{entry.children}</React.Fragment>
      ))}
    </Menu>
  )
}

export const EditMenu = React.memo(_EditMenu)
