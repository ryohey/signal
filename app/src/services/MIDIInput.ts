import { deserializeSingleEvent, Stream } from "midifile-ts"
import { addedSet, deletedSet } from "../helpers/set"
import RootStore from "../stores/RootStore"

export class MIDIInput {
  private devices: WebMidi.MIDIInput[] = []
  private listeners: ((e: WebMidi.MIDIMessageEvent) => void)[] = []

  readonly removeAllDevices = () => {
    this.devices.forEach(this.removeDevice)
  }

  readonly removeDevice = (device: WebMidi.MIDIInput) => {
    device.removeEventListener(
      "midimessage",
      this.onMidiMessage as (e: Event) => void,
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

  on(_event: "midiMessage", callback: (e: WebMidi.MIDIMessageEvent) => void) {
    this.listeners.push(callback)
  }

  off(_event: "midiMessage", callback: (e: WebMidi.MIDIMessageEvent) => void) {
    this.listeners = this.listeners.filter((cb) => cb !== callback)
  }
}

export const previewMidiInput =
  (rootStore: RootStore) => (e: WebMidi.MIDIMessageEvent) => {
    const {
      pianoRollStore,
      pianoRollStore: { selectedTrack },
      player,
    } = rootStore
    if (selectedTrack === undefined) {
      return
    }
    const { channel } = selectedTrack
    if (channel === undefined) {
      return
    }

    const stream = new Stream(e.data)
    const event = deserializeSingleEvent(stream)

    if (event.type !== "channel") {
      return
    }

    // modify channel to the selected track channel
    event.channel = channel

    player.sendEvent(event)

    if (event.subtype === "noteOn") {
      pianoRollStore.previewingNoteNumbers = addedSet(
        pianoRollStore.previewingNoteNumbers,
        event.noteNumber,
      )
    } else if (event.subtype === "noteOff") {
      pianoRollStore.previewingNoteNumbers = deletedSet(
        pianoRollStore.previewingNoteNumbers,
        event.noteNumber,
      )
    }
  }
