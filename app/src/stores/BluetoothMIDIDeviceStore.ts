import { action, makeObservable, observable } from "mobx"
import { makePersistable } from "mobx-persist-store"
import { BluetoothMIDIInputDevice } from "../services/BluetoothMIDIInputDevice"

const MIDI_SERVICE_UUID = "03b80e5a-ede8-4b33-a751-6ce34ec4c700".toLowerCase()
const MIDI_CHARACTERISTIC_UUID =
  "7772e5db-3868-4112-a1a9-f2669d106bf3".toLowerCase()

export interface BluetoothMIDIDeviceInfo {
  id: string
  name: string
  device: BluetoothDevice
}

export class BluetoothMIDIDeviceStore {
  inputs: BluetoothMIDIInputDevice[] = []
  devices: BluetoothMIDIDeviceInfo[] = []
  requestError: Error | null = null
  isLoading = false
  enabledInputs: { [deviceId: string]: boolean } = {}

  constructor() {
    makeObservable(this, {
      inputs: observable,
      devices: observable,
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

  setInputEnable(deviceId: string, enabled: boolean) {
    if (enabled && !this.inputs.some((d) => d.id === deviceId)) {
      const device = this.devices.find((d) => d.id === deviceId)?.device
      if (!device) {
        console.warn(`Device with id ${deviceId} not found`)
        return
      }
      this.connectDevice(device)
    }

    if (!enabled && this.inputs.some((d) => d.id === deviceId)) {
      this.disconnectDevice(deviceId)
    }
  }

  // BLE MIDIデバイスのスキャン（ユーザー操作必須）
  async requestDevice() {
    this.isLoading = true
    this.requestError = null
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [MIDI_SERVICE_UUID] }],
      })
      this.devices = [
        ...this.devices.filter((d) => d.id !== device.id),
        { id: device.id, name: device.name || device.id, device },
      ]
      await this.connectDevice(device)
    } catch (e) {
      this.requestError = e as Error
    } finally {
      this.isLoading = false
    }
  }

  private async disconnectDevice(deviceId: string) {
    const input = this.inputs.find((d) => d.id === deviceId)
    if (input) {
      input.disconnect()
      this.inputs = this.inputs.filter((d) => d.id !== deviceId)
    }
    this.enabledInputs = {
      ...this.enabledInputs,
      [deviceId]: false,
    }
  }

  // BLE MIDIデバイスへ接続し、BluetoothMIDIInputDeviceを生成
  private async connectDevice(device: BluetoothDevice) {
    if (this.inputs.some((d) => d.id === device.id)) {
      // 既に接続済みのデバイスは再接続しない
      return
    }
    this.isLoading = true
    this.requestError = null
    try {
      const server = await device.gatt?.connect()
      const service = await server?.getPrimaryService(MIDI_SERVICE_UUID)
      const characteristic = await service?.getCharacteristic(
        MIDI_CHARACTERISTIC_UUID,
      )
      const input = new BluetoothMIDIInputDevice(device.id, characteristic)
      this.inputs.push(input)
      this.enabledInputs = {
        ...this.enabledInputs,
        [device.id]: true,
      }
    } catch (e) {
      this.requestError = e as Error
    } finally {
      this.isLoading = false
    }
  }
}
