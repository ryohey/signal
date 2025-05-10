import { useCallback } from "react"
import { useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export interface Device {
  id: string
  name: string
  isConnected: boolean
  isEnabled: boolean
}

export function useMIDIDevice() {
  const { midiDeviceStore } = useStores()

  const inputs = useMobxStore(({ midiDeviceStore }) => midiDeviceStore.inputs)
  const outputs = useMobxStore(({ midiDeviceStore }) => midiDeviceStore.outputs)

  const enabledInputs = useMobxStore(
    ({ midiDeviceStore }) => midiDeviceStore.enabledInputs,
  )
  const enabledOutputs = useMobxStore(
    ({ midiDeviceStore }) => midiDeviceStore.enabledOutputs,
  )

  const isFactorySoundEnabled = useMobxStore(
    ({ midiDeviceStore }) => midiDeviceStore.isFactorySoundEnabled,
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
      return useMobxStore(({ midiDeviceStore }) => midiDeviceStore.isLoading)
    },
    get requestError() {
      return useMobxStore(({ midiDeviceStore }) => midiDeviceStore.requestError)
    },
    requestMIDIAccess: useCallback(() => {
      midiDeviceStore.requestMIDIAccess()
    }, [midiDeviceStore]),
    setInputEnable: useCallback(
      (deviceId: string, isEnabled: boolean) => {
        midiDeviceStore.setInputEnable(deviceId, isEnabled)
      },
      [midiDeviceStore],
    ),
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
  const enabledInputs = useMobxStore(
    ({ midiDeviceStore }) => midiDeviceStore.enabledInputs,
  )

  return Object.values(enabledInputs).filter((e) => e).length > 0
}
