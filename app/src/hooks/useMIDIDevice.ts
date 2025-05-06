import { useCallback } from "react"
import { useMobxStore } from "./useMobxSelector"
import { useStores } from "./useStores"

export function useMIDIDevice() {
  const { midiDeviceStore } = useStores()

  return {
    get inputs() {
      return useMobxStore(({ midiDeviceStore }) => midiDeviceStore.inputs)
    },
    get outputs() {
      return useMobxStore(({ midiDeviceStore }) => midiDeviceStore.outputs)
    },
    get isLoading() {
      return useMobxStore(({ midiDeviceStore }) => midiDeviceStore.isLoading)
    },
    get enabledOutputs() {
      return useMobxStore(
        ({ midiDeviceStore }) => midiDeviceStore.enabledOutputs,
      )
    },
    get enabledInputs() {
      return useMobxStore(
        ({ midiDeviceStore }) => midiDeviceStore.enabledInputs,
      )
    },
    get requestError() {
      return useMobxStore(({ midiDeviceStore }) => midiDeviceStore.requestError)
    },
    get isFactorySoundEnabled() {
      return useMobxStore(
        ({ midiDeviceStore }) => midiDeviceStore.isFactorySoundEnabled,
      )
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
        midiDeviceStore.setOutputEnable(deviceId, isEnabled)
      },
      [midiDeviceStore],
    ),
    setFactorySoundEnable: useCallback(
      (isEnabled: boolean) => {
        midiDeviceStore.isFactorySoundEnabled = isEnabled
      },
      [midiDeviceStore],
    ),
  }
}
