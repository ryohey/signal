import { AnyEvent, deserializeSingleEvent, Stream } from "midifile-ts"
import { MIDIDeviceStore } from "../stores/MIDIDeviceStore"

export interface MIDIInputEvent {
  message: AnyEvent
}

interface MIDIMessageEvent {
  data: Uint8Array
}

export class MIDIInput {
  private listeners: ((e: MIDIInputEvent) => void)[] = []

  constructor(private readonly midiDeviceStore: MIDIDeviceStore) {}

  connect(midiAccess: WebMidi.MIDIAccess) {
    for (const input of midiAccess.inputs.values()) {
      input.onmidimessage = (event) => {
        if (this.midiDeviceStore.enabledInputs[input.id]) {
          const data = event.data
          if (data !== null) {
            this.onMidiMessage?.({ data })
          }
        }
      }
    }
  }

  readonly onMidiMessage = (e: MIDIMessageEvent) => {
    const stream = new Stream(e.data)
    const message = deserializeSingleEvent(stream)
    const event = { data: e.data, message }
    this.listeners.forEach((callback) => callback(event))
  }

  on(event: "midiMessage", callback: (e: MIDIInputEvent) => void) {
    this.listeners.push(callback)
    return () => {
      this.off(event, callback)
    }
  }

  off(_event: "midiMessage", callback: (e: MIDIInputEvent) => void) {
    this.listeners = this.listeners.filter((cb) => cb !== callback)
  }
}
