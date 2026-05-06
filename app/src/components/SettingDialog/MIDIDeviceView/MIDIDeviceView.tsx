import styled from "@emotion/styled"
import BluetoothIcon from "mdi-react/BluetoothIcon"
import { FC, useCallback, useMemo } from "react"
import { useBLEMIDIDevice } from "../../../hooks/useBLEMIDIDevice"
import { Device, useMIDIDevice } from "../../../hooks/useMIDIDevice"
import { Localized } from "../../../localize/useLocalization"
import { DialogContent, DialogTitle } from "../../Dialog/Dialog"
import { Alert } from "../../ui/Alert"
import { Checkbox } from "../../ui/Checkbox"
import { CircularProgress } from "../../ui/CircularProgress"
import { Label } from "../../ui/Label"
import { RadioButton } from "../../ui/RadioButton"

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

const SectionTitle = styled.div`
  font-weight: bold;
  margin: 2rem 0 0.75rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;

  &:hover {
    background: var(--color-highlight);
    color: var(--color-text);
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`

const Divider = styled.div`
  height: 1px;
  background: var(--color-divider);
  margin: 1rem 0;
`

export const MIDIDeviceView: FC = () => {
  const {
    inputDevices: midiInputDevices,
    outputDevices,
    isLoading: midiIsLoading,
    requestError: midiRequestError,
    midiInputRouting,
    setInputEnable: setMidiInputEnable,
    setOutputEnable,
    setMidiInputRouting,
  } = useMIDIDevice()

  const {
    inputDevices: btInputDevices,
    isBluetoothSupported,
    isLoading: btIsLoading,
    requestError: btRequestError,
    requestBluetoothMIDIDevice,
    setInputEnable: setBTInputEnable,
  } = useBLEMIDIDevice()

  const isLoading = midiIsLoading || btIsLoading
  const requestError = midiRequestError || btRequestError

  const inputDevices: Device[] = useMemo(
    () => [...midiInputDevices, ...btInputDevices],
    [midiInputDevices, btInputDevices],
  )

  const setInputEnable = useCallback(
    (deviceId: string, isEnabled: boolean) => {
      if (btInputDevices.some((d) => d.id === deviceId)) {
        setBTInputEnable(deviceId, isEnabled)
      } else {
        setMidiInputEnable(deviceId, isEnabled)
      }
    },
    [setBTInputEnable, setMidiInputEnable, btInputDevices],
  )

  return (
    <>
      <DialogTitle>
        <Localized name="midi-settings" />
      </DialogTitle>
      <DialogContent>
        {isLoading && <CircularProgress />}
        {requestError && (
          <Alert severity="warning">{requestError.message}</Alert>
        )}
        {!isLoading && (
          <>
            <SectionTitle>
              <Localized name="inputs" />
              {isBluetoothSupported && (
                <IconButton
                  onClick={requestBluetoothMIDIDevice}
                  title="Connect Bluetooth MIDI Device"
                >
                  <BluetoothIcon />
                </IconButton>
              )}
            </SectionTitle>
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
            <SectionTitle>
              <Localized name="midi-routing" />
            </SectionTitle>
            <RadioButton
              label={<Localized name="midi-routing-selected-track" />}
              description={
                <Localized name="midi-routing-selected-track-description" />
              }
              isSelected={midiInputRouting === "selectedTrack"}
              onClick={() => setMidiInputRouting("selectedTrack")}
            />
            <RadioButton
              label={<Localized name="midi-routing-channel" />}
              description={
                <Localized name="midi-routing-channel-description" />
              }
              isSelected={midiInputRouting === "channelRouting"}
              onClick={() => setMidiInputRouting("channelRouting")}
            />
            <Divider />
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
        )}
      </DialogContent>
    </>
  )
}
