export class MIDIInput {
  private devices: WebMidi.MIDIInput[] = []
  onMessage: ((e: WebMidi.MIDIMessageEvent) => void) | undefined

  removeAllDevices = () => {
    this.devices.forEach(this.removeDevice)
  }

  removeDevice = (device: WebMidi.MIDIInput) => {
    device.removeEventListener(
      "midimessage",
      this.onMidiMessage as (e: Event) => void,
    )
    this.devices = this.devices.filter((d) => d.id !== device.id)
  }

  addDevice = (device: WebMidi.MIDIInput) => {
    device.addEventListener("midimessage", this.onMidiMessage)
    this.devices.push(device)
  }

  onMidiMessage = (e: WebMidi.MIDIMessageEvent) => {
    this.onMessage?.(e)
  }
}
