import { useTheme } from "@emotion/react"
import ChevronRight from "mdi-react/ChevronRightIcon"
import CloudOutlined from "mdi-react/CloudOutlineIcon"
import KeyboardArrowDown from "mdi-react/KeyboardArrowDownIcon"
import { type FC, useCallback, useState } from "react"
import { hasFSAccess } from "../../actions/file"
import { useAuth } from "../../hooks/useAuth"
import { useExport } from "../../hooks/useExport"
import { useRootView } from "../../hooks/useRootView"
import { Localized } from "../../localize/useLocalization"
import { Menu, MenuDivider, MenuItem, SubMenu } from "../ui/Menu"
import { CloudFileMenu } from "./CloudFileMenu"
import { FileMenu } from "./FileMenu"
import { LegacyFileMenu } from "./LegacyFileMenu"
import { Tab } from "./Navigation"

export const FileMenuButton: FC = () => {
  const { authUser: user } = useAuth()
  const { setOpenSignInDialog } = useRootView()
  const { exportSong } = useExport()
  const theme = useTheme()
  const [isOpen, setOpen] = useState(false)

  const handleClose = useCallback(() => setOpen(false), [])

  const onClickExportWav = useCallback(() => {
    handleClose()
    exportSong("WAV")
  }, [handleClose, exportSong])

  const onClickExportMp3 = useCallback(() => {
    handleClose()
    exportSong("MP3")
  }, [handleClose, exportSong])

  return (
    <Menu
      open={isOpen}
      onOpenChange={setOpen}
      trigger={
        <Tab id="tab-file">
          <span style={{ marginLeft: "0.25rem" }}>
            <Localized name="file" />
          </span>
          <KeyboardArrowDown style={{ width: "1rem", marginLeft: "0.25rem" }} />
        </Tab>
      }
    >
      {user === null && hasFSAccess && <FileMenu close={handleClose} />}

      {user === null && !hasFSAccess && <LegacyFileMenu close={handleClose} />}

      {user && <CloudFileMenu close={handleClose} />}

      {user === null && (
        <>
          <MenuDivider />
          <MenuItem
            onClick={() => {
              handleClose()
              setOpenSignInDialog(true)
            }}
          >
            <CloudOutlined style={{ marginRight: "0.5em" }} />
            <Localized name="please-sign-up" />
          </MenuItem>
        </>
      )}

      <MenuDivider />

      <SubMenu
        trigger={
          <MenuItem>
            <Localized name="export" />
            <ChevronRight
              style={{ marginLeft: "auto", fill: theme.tertiaryTextColor }}
            />
          </MenuItem>
        }
      >
        <MenuItem onClick={onClickExportWav}>WAV</MenuItem>
        <MenuItem onClick={onClickExportMp3}>MP3</MenuItem>
      </SubMenu>
    </Menu>
  )
}
