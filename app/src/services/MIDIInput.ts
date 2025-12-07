export class MIDIInput {
  private devices: WebMidi.MIDIInput[] = []
  private listeners: ((e: WebMidi.MIDIMessageEvent) => void)[] = []

  readonly removeAllDevices = () => {
    this.devices.forEach(this.removeDevice)
  }

  readonly removeDevice = (device: WebMidi.MIDIInput) => {
    device.removeEventListener(
      "midimessage",
      this.onMidiMessage as (e: Event) => void
    )
    this.devices = this.devices.filter((d) => d.id !== device.id)
  }

  readonly addDevice = (device: WebMidi.MIDIInput) => {
    device.addEventListener("midimessage", this.onMidiMessage)
    this.devices.push(device)
  }

  readonly onMidiMessage = (e: WebMidi.MIDIMessageEvent) => {
    this.listeners.forEach((callback) => callback(e))
  }

  on(event: "midiMessage", callback: (e: WebMidi.MIDIMessageEvent) => void) {
    this.listeners.push(callback)
    return () => {
      this.off(event, callback)
    }
  }

  off(_event: "midiMessage", callback: (e: WebMidi.MIDIMessageEvent) => void) {
    this.listeners = this.listeners.filter((cb) => cb !== callback)
  }
}
