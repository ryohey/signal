import KeyboardArrowDown from "mdi-react/KeyboardArrowDownIcon"
import { FC, useCallback, useRef } from "react"
import { useRootView } from "../../hooks/useRootView"
import { Localized } from "../../localize/useLocalization"
import { Menu } from "../ui/Menu"
import { EditMenu } from "./EditMenu"
import { Tab } from "./Navigation"

export const EditMenuButton: FC = () => {
  const { openEditDrawer: isOpen, setOpenEditDrawer } = useRootView()

  const handleClose = () => setOpenEditDrawer(false)

  const ref = useRef<HTMLDivElement>(null)

  return (
    <Menu
      open={isOpen}
      onOpenChange={setOpenEditDrawer}
      trigger={
        <Tab
          ref={ref}
          onClick={useCallback(
            () => setOpenEditDrawer(true),
            [setOpenEditDrawer],
          )}
          id="tab-edit"
        >
          <span style={{ marginLeft: "0.25rem" }}>
            <Localized name="edit" />
          </span>
          <KeyboardArrowDown style={{ width: "1rem", marginLeft: "0.25rem" }} />
        </Tab>
      }
    >
      <EditMenu close={handleClose} />
    </Menu>
  )
}
