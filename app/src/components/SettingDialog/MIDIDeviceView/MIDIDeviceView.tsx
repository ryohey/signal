import styled from "@emotion/styled"
import { FC } from "react"
import { Device, useMIDIDevice } from "../../../hooks/useMIDIDevice"
import { Localized } from "../../../localize/useLocalization"
import { DialogContent, DialogTitle } from "../../Dialog/Dialog"
import { Alert } from "../../ui/Alert"
import { Button } from "../../ui/Button"
import { Checkbox } from "../../ui/Checkbox"
import { CircularProgress } from "../../ui/CircularProgress"
import { Label } from "../../ui/Label"

interface ListItem {
  device: Device
  onCheck: (isChecked: boolean) => void
}

const DeviceRow: FC<ListItem> = ({ device, onCheck }) => {
  return (
    <Label
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "1rem",
      }}
    >
      <Checkbox
        checked={device.isEnabled}
        onCheckedChange={(state) => onCheck(state === true)}
        style={{ marginRight: "0.5rem" }}
        label={
          <>
            {device.name}
            {!device.isConnected && " (disconnected)"}
          </>
        }
      />
    </Label>
  )
}

const DeviceList = styled.div``

const Notice = styled.div`
  color: var(--color-text-secondary);
`

const Spacer = styled.div`
  height: 2rem;
`

const SectionTitle = styled.div`
  font-weight: bold;
  margin: 1rem 0;
`

export const MIDIDeviceView: FC = () => {
  const {
    inputDevices,
    outputDevices,
    isLoading,
    requestError,
    setInputEnable,
    setOutputEnable,
    requestBluetoothMIDIDevice,
  } = useMIDIDevice()

  return (
    <>
      <DialogTitle>
        <Localized name="midi-settings" />
      </DialogTitle>
      <DialogContent>
        {isLoading && <CircularProgress />}
        {requestError && (
          <>
            <Alert severity="warning">{requestError.message}</Alert>
            <Spacer />
          </>
        )}
        {!isLoading && (
          <>
            <SectionTitle>
              <Localized name="inputs" />
            </SectionTitle>
            <Button
              onClick={requestBluetoothMIDIDevice}
              style={{ marginBottom: 8 }}
            >
              Connect Bluetooth MIDI Device
            </Button>
            <DeviceList>
              {inputDevices.length === 0 && (
                <Notice>
                  <Localized name="no-inputs" />
                </Notice>
              )}
              {inputDevices.map((device) => (
                <DeviceRow
                  key={device.id}
                  device={device}
                  onCheck={async (checked) => {
                    setInputEnable(device.id, checked)
                  }}
                />
              ))}
            </DeviceList>
            {
              <>
                <Spacer />
                <SectionTitle>
                  <Localized name="outputs" />
                </SectionTitle>
                <DeviceList>
                  {outputDevices.map((device) => (
                    <DeviceRow
                      key={device.id}
                      device={device}
                      onCheck={(checked) => setOutputEnable(device.id, checked)}
                    />
                  ))}
                </DeviceList>
              </>
            }
          </>
        )}
      </DialogContent>
    </>
  )
}
