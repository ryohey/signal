import styled from "@emotion/styled"
import { FC, useCallback, useState } from "react"
import { useRootView } from "../../hooks/useRootView"
import { Localized } from "../../localize/useLocalization"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../Dialog/Dialog"
import { Button } from "../ui/Button"
import { GeneralSettingsView } from "./GeneralSettingsView"
import { MIDIDeviceView } from "./MIDIDeviceView/MIDIDeviceView"
import { SettingNavigation, SettingRoute } from "./SettingNavigation"
import { SoundFontSettingsView } from "./SoundFontSettingView"

const RouteContent: FC<{ route: SettingRoute }> = ({ route }) => {
  switch (route) {
    case "general":
      return <GeneralSettingsView />
    case "midi":
      return <MIDIDeviceView />
    case "soundfont":
      return <SoundFontSettingsView />
  }
}
const Content = styled.div`
  flex-grow: 1;
  min-height: 24rem;
`

export const SettingDialog: FC = () => {
  const { openSettingDialog: open, setOpenSettingDialog } = useRootView()
  const [route, setRoute] = useState<SettingRoute>("general")

  const onClose = useCallback(
    () => setOpenSettingDialog(false),
    [setOpenSettingDialog],
  )

  return (
    <Dialog open={open} onOpenChange={onClose} style={{ minWidth: "32rem" }}>
      <DialogTitle>
        <Localized name="settings" />
      </DialogTitle>
      <DialogContent style={{ display: "flex", flexDirection: "row" }}>
        <SettingNavigation route={route} onChange={setRoute} />
        <Content>
          <RouteContent route={route} />
        </Content>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          <Localized name="close" />
        </Button>
      </DialogActions>
    </Dialog>
  )
}
