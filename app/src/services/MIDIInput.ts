import { deserializeSingleEvent, Stream } from "midifile-ts"
import RootStore from "../stores/RootStore"

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

export const previewMidiInput =
  (rootStore: RootStore) => (e: WebMidi.MIDIMessageEvent) => {
    const {
      pianoRollStore,
      pianoRollStore: { selectedTrack },
      player,
    } = rootStore

    const stream = new Stream(e.data)
    const event = deserializeSingleEvent(stream)

    if (event.type !== "channel") {
      return
    }

    // TODO: seems like if sending to a channel which is not mapped to a Track, it defaults to playing the default piano. This should not happen.
    player.sendEvent(event)

    // optional, only showing notes in piano roll if its the same channel as selected track
    if (event.channel !== selectedTrack?.channel) return;

    if (event.subtype === "noteOn") {
      pianoRollStore.previewingNoteNumbers.add(event.noteNumber)
    } else if (event.subtype === "noteOff") {
      pianoRollStore.previewingNoteNumbers.delete(event.noteNumber)
    }
  }
