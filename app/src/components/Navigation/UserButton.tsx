import { useTheme } from "@emotion/react"
import AccountCircle from "mdi-react/AccountCircleIcon"
import { FC, useRef, useState } from "react"
import { isRunningInElectron } from "../../helpers/platform"
import { useAuth } from "../../hooks/useAuth"
import { useRootView } from "../../hooks/useRootView"
import { Localized } from "../../localize/useLocalization"
import { Menu, MenuItem } from "../ui/Menu"
import { IconStyle, Tab, TabTitle } from "./Navigation"

export const UserButton: FC = () => {
  const { authUser: user, signOut } = useAuth()
  const { setOpenSignInDialog, setOpenUserSettingsDialog } = useRootView()

  const [open, setOpen] = useState(false)

  const onClickSignIn = () => {
    if (isRunningInElectron()) {
      window.electronAPI.openAuthWindow()
    } else {
      setOpenSignInDialog(true)
    }
    setOpen(false)
  }

  const onClickSignOut = async () => {
    await signOut()
    setOpen(false)
  }

  const onClickProfile = () => {
    if (user !== null) {
      window.open(`https://signalmidi.app/users/${user.uid}`)
    }
    setOpen(false)
  }

  const onClickUserSettings = () => {
    setOpenUserSettingsDialog(true)
  }

  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)

  if (user === null) {
    return (
      <Tab onClick={onClickSignIn}>
        <AccountCircle style={IconStyle} />
        <TabTitle>
          <Localized name="sign-in" />
        </TabTitle>
      </Tab>
    )
  }

  return (
    <Menu
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Tab ref={ref}>
          <img
            style={{
              ...IconStyle,
              borderRadius: "0.65rem",
              border: `1px solid ${theme.dividerColor}`,
            }}
            src={user.photoURL ?? undefined}
          />
          <TabTitle>{user.displayName}</TabTitle>
        </Tab>
      }
    >
      <MenuItem onClick={onClickProfile}>
        <Localized name="profile" />
      </MenuItem>

      <MenuItem onClick={onClickUserSettings}>
        <Localized name="user-settings" />
      </MenuItem>

      <MenuItem onClick={onClickSignOut}>
        <Localized name="sign-out" />
      </MenuItem>
    </Menu>
  )
}
