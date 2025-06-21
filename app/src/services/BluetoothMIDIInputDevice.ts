import { BLEMIDIStreamParser } from "./BLEMIDIStreamParser"
import { IMIDIInputDevice } from "./MIDIInput"

type BluetoothRemoteGATTCharacteristic = any

// WebMidi.MIDIMessageEventの最低限必要な型を独自定義
type MIDIMessageEventLike = {
  data: Uint8Array
  receivedTime: number
}

// Bluetooth MIDIデバイスをIMIDIInputDeviceに適合させるクラス
export class BluetoothMIDIInputDevice implements IMIDIInputDevice {
  id: string
  private characteristic: BluetoothRemoteGATTCharacteristic
  private listeners: Array<(e: MIDIMessageEventLike) => void> = []
  private readonly parser: BLEMIDIStreamParser

  constructor(id: string, characteristic: BluetoothRemoteGATTCharacteristic) {
    this.id = id
    this.characteristic = characteristic
    this.parser = new BLEMIDIStreamParser((message) => {
      this.listeners.forEach((cb) =>
        cb({
          data: message.message.slice(),
          receivedTime: Date.now(),
        }),
      )
    })
    this.characteristic.addEventListener(
      "characteristicvaluechanged",
      this.handleValueChanged,
    )
    this.characteristic.startNotifications()
  }

  disconnect() {
    this.characteristic.removeEventListener(
      "characteristicvaluechanged",
      this.handleValueChanged,
    )
    this.characteristic.stopNotifications()
  }

  addEventListener(type: "midimessage", listener: (e: any) => void) {
    if (type !== "midimessage") return
    this.listeners.push(listener)
  }

  removeEventListener(type: "midimessage", listener: (e: any) => void) {
    if (type !== "midimessage") return
    this.listeners = this.listeners.filter((cb) => cb !== listener)
  }

  private handleValueChanged = (event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic
    if (characteristic.value) {
      const dataView = new DataView(characteristic.value.buffer)
      this.parser.push(dataView)
    }
  }
}
