import { action, makeObservable, observable } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { BLEMIDI, BLEMIDIDevice, MIDIMessageEvent } from "web-ble-midi"
import { MIDIInput } from "../services/MIDIInput"

export interface BluetoothMIDIDeviceInfo {
  id: string
  name: string
  device: BluetoothDevice
}

export class BluetoothMIDIDeviceStore {
  inputs: BLEMIDIDevice[] = []
  requestError: Error | null = null
  isLoading = false
  enabledInputs: { [deviceId: string]: boolean } = {}

  constructor(private readonly midiInput: MIDIInput) {
    makeObservable(this, {
      inputs: observable,
      requestError: observable,
      isLoading: observable,
      enabledInputs: observable,
      setInputEnable: action,
      requestDevice: action,
    })

    makePersistable(this, {
      name: "BluetoothMIDIDeviceStore",
      properties: ["enabledInputs"],
      storage: window.localStorage,
    })
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

  // BLE MIDIデバイスのスキャン（ユーザー操作必須）
  async requestDevice() {
    this.isLoading = true
    this.requestError = null
    try {
      const device = await BLEMIDI.scan()
      if (!this.inputs.some((d) => d.id === device.id)) {
        device.addEventListener("disconnect", () => {
          this.inputs = this.inputs.filter((d) => d.id !== device.id)
        })
        device.addEventListener("midimessage", (event) => {
          if (this.enabledInputs[device.id]) {
            this.midiInput.onMidiMessage({
              data: (event as MIDIMessageEvent).message.message.slice(0),
              // timeStamp: message.timestampMs,
            })
          }
        })
        this.inputs.push(device)
      }
      await this.setInputEnable(device.id, true)
    } catch (e) {
      this.requestError = e as Error
    } finally {
      this.isLoading = false
    }
  }
}
