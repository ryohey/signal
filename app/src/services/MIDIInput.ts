export interface MIDIInputEvent {
  data: Uint8Array
}

export class MIDIInput {
  private listeners: ((e: MIDIInputEvent) => void)[] = []

  readonly onMidiMessage = (e: MIDIInputEvent) => {
    this.listeners.forEach((callback) => callback(e))
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
