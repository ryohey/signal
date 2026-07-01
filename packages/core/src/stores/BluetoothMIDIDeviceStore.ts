import { Observable, ObservableValue } from "@signal-app/observable"
import { BLEMIDIDevice, MIDIMessageEvent } from "web-ble-midi"
import { MIDIInput } from "../services/MIDIInput"

const STORAGE_KEY = "BluetoothMIDIDeviceStore"

export class BluetoothMIDIDeviceStore {
  private readonly _inputs = new ObservableValue<BLEMIDIDevice[]>([])
  private readonly _enabledInputs = new ObservableValue<
    Record<string, boolean>
  >({})

  constructor(private readonly midiInput: MIDIInput) {
    this._enabledInputs.set(loadEnabledInputs())
    this._enabledInputs.onChanged.subscribe(() => {
      this.persistEnabledInputs()
    })
  }

  get inputs(): BLEMIDIDevice[] {
    return this._inputs.value
  }

  private set inputs(value: BLEMIDIDevice[]) {
    this._inputs.set(value)
  }

  get onInputsChanged(): Observable {
    return this._inputs.onChanged
  }

  get enabledInputs(): Record<string, boolean> {
    return this._enabledInputs.value
  }

  private set enabledInputs(value: Record<string, boolean>) {
    this._enabledInputs.set(value)
  }

  get onEnabledInputsChanged(): Observable {
    return this._enabledInputs.onChanged
  }

  private persistEnabledInputs() {
    saveEnabledInputs(this.enabledInputs)
  }

  async setInputEnable(deviceId: string, enabled: boolean) {
    const device = this.inputs.find((d) => d.id === deviceId)

    if (!device) {
      console.warn(`Device with id ${deviceId} not found`)
      return
    }

    if (enabled && !device.isConnected()) {
      await device.connect()

      this.enabledInputs = {
        ...this.enabledInputs,
        [deviceId]: true,
      }
    }

    if (!enabled && device.isConnected()) {
      device.disconnect()

      this.enabledInputs = {
        ...this.enabledInputs,
        [deviceId]: false,
      }
    }
  }

  // 起動時に以前許可したデバイスへ自動再接続
  async autoConnect() {
    if (!navigator.bluetooth?.getDevices) {
      return
    }
    let bluetoothDevices: BluetoothDevice[]
    try {
      bluetoothDevices = await navigator.bluetooth.getDevices()
    } catch {
      return
    }
    for (const bluetoothDevice of bluetoothDevices) {
      const device = new BLEMIDIDevice(bluetoothDevice)
      this.registerDevice(device)
      if (this.enabledInputs[device.id]) {
        device.connect().catch((e) => {
          console.warn(`Auto-connect failed for ${device.name}:`, e)
        })
      }
    }
  }

  registerDevice(device: BLEMIDIDevice) {
    if (this.inputs.some((d) => d.id === device.id)) {
      return
    }
    device.addEventListener("disconnect", () => {
      this.inputs = this.inputs.filter((d) => d.id !== device.id)
    })
    device.addEventListener("midimessage", (event) => {
      if (this.enabledInputs[device.id]) {
        this.midiInput.onMidiMessage({
          data: (event as MIDIMessageEvent).message.message.slice(0),
        })
      }
    })
    this.inputs = [...this.inputs, device]
  }
}

function saveEnabledInputs(enabledInputs: Record<string, boolean>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledInputs))
}

function loadEnabledInputs(): Record<string, boolean> {
  try {
    const json = window.localStorage.getItem(STORAGE_KEY)
    if (json === null) {
      return {}
    }
    const value = JSON.parse(json)
    if (value !== null && typeof value === "object") {
      return value as Record<string, boolean>
    }
  } catch {
    // Ignore invalid persisted data and fall back to defaults.
  }
  return {}
}
