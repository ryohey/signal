import { action, makeObservable, observable } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { BLEMIDIDevice, MIDIMessageEvent } from "web-ble-midi"
import { mobxToObservable } from "../helpers/mobxToObservable"
import { Observable } from "../helpers/observable"
import { MIDIInput } from "../services/MIDIInput"

export class BluetoothMIDIDeviceStore {
  inputs: BLEMIDIDevice[] = []
  enabledInputs: { [deviceId: string]: boolean } = {}

  readonly onInputsChanged: Observable
  readonly onEnabledInputsChanged: Observable

  constructor(private readonly midiInput: MIDIInput) {
    makeObservable(this, {
      inputs: observable,
      enabledInputs: observable,
      setInputEnable: action,
      registerDevice: action,
    })

    makePersistable(this, {
      name: "BluetoothMIDIDeviceStore",
      properties: ["enabledInputs"],
      storage: window.localStorage,
    })

    this.onInputsChanged = mobxToObservable(this, "inputs")
    this.onEnabledInputsChanged = mobxToObservable(this, "enabledInputs")
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
    this.inputs.push(device)
  }
}
