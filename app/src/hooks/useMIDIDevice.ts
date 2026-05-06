import { atom, useAtomValue } from "jotai"
import { useAtomCallback } from "jotai/utils"
import { useCallback, useEffect, useSyncExternalStore } from "react"
import MIDIOutput from "../services/MIDIOutput"
import { usePlayer } from "./usePlayer"
import { useStores } from "./useStores"

export interface Device {
  id: string
  name: string
  isConnected: boolean
  isEnabled: boolean
  isBluetooth?: boolean
}

export function MIDIDeviceProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useSyncOutputDevices()

  return children
}

export function useMIDIDevice() {
  const { midiDeviceStore, midiInput } = useStores()

  const inputs = useAtomValue(inputsAtom)
  const outputs = useAtomValue(outputsAtom)

  const enabledInputs = useSyncExternalStore(
    midiDeviceStore.onEnabledInputsChanged.subscribe,
    useCallback(() => midiDeviceStore.enabledInputs, [midiDeviceStore]),
  )
  const enabledOutputs = useSyncExternalStore(
    midiDeviceStore.onEnabledOutputsChanged.subscribe,
    useCallback(() => midiDeviceStore.enabledOutputs, [midiDeviceStore]),
  )

  const isFactorySoundEnabled = useSyncExternalStore(
    midiDeviceStore.onIsFactorySoundEnabledChanged.subscribe,
    useCallback(() => midiDeviceStore.isFactorySoundEnabled, [midiDeviceStore]),
  )

  const inputDevices: Device[] = inputs.map((device) => ({
    id: device.id,
    name: formatName(device),
    isConnected: device.state === "connected",
    isEnabled: enabledInputs[device.id],
    isBluetooth: false,
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
      isBluetooth: false,
    })),
  ]

  const requestMIDIAccess = useAtomCallback(
    useCallback(
      async (_get, set) => {
        try {
          set(isLoadingAtom, true)
          set(inputsAtom, [])
          set(outputsAtom, [])

          if (navigator.requestMIDIAccess === undefined) {
            throw new Error("Web MIDI API is not supported by your browser")
          }

          const midiAccess = (await navigator.requestMIDIAccess({
            sysex: true,
          })) as WebMidi.MIDIAccess

          midiAccess.onstatechange = () => {
            set(inputsAtom, Array.from(midiAccess.inputs.values()))
            set(outputsAtom, Array.from(midiAccess.outputs.values()))
          }

          midiInput.connect(midiAccess)
        } catch (error) {
          set(requestErrorAtom, error as Error)
        } finally {
          set(isLoadingAtom, false)
        }
      },
      [midiInput],
    ),
  )

  return {
    inputDevices,
    outputDevices,
    get isLoading() {
      return useAtomValue(isLoadingAtom)
    },
    get requestError() {
      return useAtomValue(requestErrorAtom)
    },
    get midiInputRouting() {
      return useSyncExternalStore(
        midiDeviceStore.onMidiInputRoutingChanged.subscribe,
        useCallback(() => midiDeviceStore.midiInputRouting, [midiDeviceStore]),
      )
    },
    initMIDIDevice: requestMIDIAccess,
    setInputEnable: useCallback(
      (deviceId: string, isEnabled: boolean) => {
        midiDeviceStore.setInputEnable(deviceId, isEnabled)
      },
      [midiDeviceStore],
    ),
    setMidiInputRouting: midiDeviceStore.setMidiInputRouting,
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
  const enabledInputs = useSyncExternalStore(
    midiDeviceStore.onEnabledInputsChanged.subscribe,
    useCallback(() => midiDeviceStore.enabledInputs, [midiDeviceStore]),
  )

  return Object.values(enabledInputs).filter((e) => e).length > 0
}

// atoms
const isLoadingAtom = atom(false)
const requestErrorAtom = atom<Error | null>(null)
const inputsAtom = atom<readonly WebMidi.MIDIInput[]>([])
const outputsAtom = atom<readonly WebMidi.MIDIOutput[]>([])

// sync synthGroup.output to enabledOutputIds/isFactorySoundEnabled
function useSyncOutputDevices() {
  const { allSoundsOff } = usePlayer()
  const { midiDeviceStore, synthGroup, synth } = useStores()
  const outputs = useAtomValue(outputsAtom)
  const enabledOutputs = useSyncExternalStore(
    midiDeviceStore.onEnabledOutputsChanged.subscribe,
    useCallback(() => midiDeviceStore.enabledOutputs, [midiDeviceStore]),
  )
  const isFactorySoundEnabled = useSyncExternalStore(
    midiDeviceStore.onIsFactorySoundEnabledChanged.subscribe,
    useCallback(() => midiDeviceStore.isFactorySoundEnabled, [midiDeviceStore]),
  )

  return useEffect(() => {
    allSoundsOff()

    const midiDeviceEntries = outputs.map((device) => ({
      synth: new MIDIOutput(device),
      isEnabled: enabledOutputs[device.id],
    }))

    synthGroup.outputs = [
      {
        synth,
        isEnabled: isFactorySoundEnabled,
      },
      ...midiDeviceEntries,
    ]
  }, [
    outputs,
    enabledOutputs,
    isFactorySoundEnabled,
    allSoundsOff,
    synthGroup,
    synth,
  ])
}
