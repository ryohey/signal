import styled from "@emotion/styled"
import { FC } from "react"
import { useMIDIDevice } from "../../../hooks/useMIDIDevice"
import { Localized } from "../../../localize/useLocalization"
import { DialogContent, DialogTitle } from "../../Dialog/Dialog"
import { Alert } from "../../ui/Alert"
import { Checkbox } from "../../ui/Checkbox"
import { CircularProgress } from "../../ui/CircularProgress"
import { Label } from "../../ui/Label"

interface Device {
  id: string
  name: string
  isConnected: boolean
}

interface ListItem {
  device: Device
  isSelected: boolean
  onCheck: (isChecked: boolean) => void
}

const DeviceRow: FC<ListItem> = ({ device, isSelected, onCheck }) => {
  return (
    <Label
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "1rem",
      }}
    >
      <Checkbox
        checked={isSelected}
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
    inputs,
    outputs,
    isLoading,
    requestError,
    enabledInputs,
    enabledOutputs,
    isFactorySoundEnabled,
    setInputEnable,
    setOutputEnable,
    setFactorySoundEnable,
  } = useMIDIDevice()

  const formatName = (device: WebMidi.MIDIPort) =>
    (device?.name ?? "") +
    ((device.manufacturer?.length ?? 0) > 0 ? `(${device.manufacturer})` : "")

  const portToDevice = (device: WebMidi.MIDIPort): Device => ({
    id: device.id,
    name: formatName(device),
    isConnected: device.state === "connected",
  })

  const inputDevices = inputs.map((device) => ({
    device: portToDevice(device),
    isSelected: enabledInputs[device.id],
  }))

  const outputDevices = outputs.map((device) => ({
    device: portToDevice(device),
    isSelected: enabledOutputs[device.id],
  }))

  const factorySound: Device = {
    id: "signal-midi-app",
    name: "Signal Factory Sound",
    isConnected: true,
  }

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
            <DeviceList>
              {inputDevices.length === 0 && (
                <Notice>
                  <Localized name="no-inputs" />
                </Notice>
              )}
              {inputDevices.map(({ device, isSelected }) => (
                <DeviceRow
                  key={device.id}
                  device={device}
                  isSelected={isSelected}
                  onCheck={(checked) => setInputEnable(device.id, checked)}
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
                  <DeviceRow
                    device={factorySound}
                    isSelected={isFactorySoundEnabled}
                    onCheck={setFactorySoundEnable}
                  />
                  {outputDevices.map(({ device, isSelected }) => (
                    <DeviceRow
                      key={device.id}
                      device={device}
                      isSelected={isSelected}
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
