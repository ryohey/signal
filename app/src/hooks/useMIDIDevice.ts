import { useCallback } from "react"
import { useMobxGetter } from "./useMobxSelector"
import { useStores } from "./useStores"

export interface Device {
  id: string
  name: string
  isConnected: boolean
  isEnabled: boolean
}

export function useMIDIDevice() {
  const { midiDeviceStore } = useStores()

  const inputs = useMobxGetter(midiDeviceStore, "inputs")
  const outputs = useMobxGetter(midiDeviceStore, "outputs")

  const enabledInputs = useMobxGetter(midiDeviceStore, "enabledInputs")
  const enabledOutputs = useMobxGetter(midiDeviceStore, "enabledOutputs")

  const isFactorySoundEnabled = useMobxGetter(
    midiDeviceStore,
    "isFactorySoundEnabled",
  )

  const inputDevices: Device[] = inputs.map((device) => ({
    id: device.id,
    name: formatName(device),
    isConnected: device.state === "connected",
    isEnabled: enabledInputs[device.id],
  }))

  const outputDevices: Device[] = [
    {
      ...factorySound,
      isEnabled: isFactorySoundEnabled,
    },
    ...outputs.map((device) => ({
      id: device.id,
      name: formatName(device),
      isConnected: device.state === "connected",
      isEnabled: enabledOutputs[device.id],
    })),
  ]

  return {
    inputDevices,
    outputDevices,
    get isLoading() {
      return useMobxGetter(midiDeviceStore, "isLoading")
    },
    get requestError() {
      return useMobxGetter(midiDeviceStore, "requestError")
    },
    requestMIDIAccess: midiDeviceStore.requestMIDIAccess,
    setInputEnable: midiDeviceStore.setInputEnable,
    setOutputEnable: useCallback(
      (deviceId: string, isEnabled: boolean) => {
        if (deviceId === factorySound.id) {
          midiDeviceStore.isFactorySoundEnabled = isEnabled
        } else {
          midiDeviceStore.setOutputEnable(deviceId, isEnabled)
        }
      },
      [midiDeviceStore],
    ),
  }
}

const formatName = (device: WebMidi.MIDIPort) =>
  (device?.name ?? "") +
  ((device.manufacturer?.length ?? 0) > 0 ? `(${device.manufacturer})` : "")

const factorySound = {
  id: "signal-midi-app",
  name: "Signal Factory Sound",
  isConnected: true,
}

export const useCanRecord = () => {
  const { midiDeviceStore } = useStores()
  const enabledInputs = useMobxGetter(midiDeviceStore, "enabledInputs")

  return Object.values(enabledInputs).filter((e) => e).length > 0
}
