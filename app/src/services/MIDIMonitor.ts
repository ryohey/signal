import { controllerMidiEvent, programChangeMidiEvent } from "@signal-app/core"
import { Player } from "@signal-app/player"
import { deserializeSingleEvent, Stream } from "midifile-ts"

export class MIDIMonitor {
  private _channel: number = 0
  private _programNumber: number = 0

  constructor(private readonly player: Player) {}

  set channel(value: number) {
    const previousChannel = this._channel
    this._channel = value

    // When switching channels, send bank select and program change
    // to ensure the synthesizer loads the correct instrument
    if (previousChannel !== value) {
      this.initializeChannel(value, this._programNumber)
    }
  }

  get channel(): number {
    return this._channel
  }

  set programNumber(value: number) {
    this._programNumber = value
  }

  private initializeChannel(channel: number, programNumber: number) {
    // Channel 9 (0-indexed) is the standard MIDI drum channel
    // Drums use bank 128 in General MIDI SoundFonts
    const isDrumChannel = channel === 9
    const bank = isDrumChannel ? 128 : 0

    // Send bank select (CC 0) followed by program change
    // This ensures the synthesizer loads the correct instrument/drum kit
    this.player.sendEvent(controllerMidiEvent(0, channel, 0, bank))
    this.player.sendEvent(programChangeMidiEvent(0, channel, programNumber))
  }

  onMessage(e: WebMidi.MIDIMessageEvent) {
    let event

    try {
      const stream = new Stream(e.data)
      event = deserializeSingleEvent(stream)
    } catch {
      // Ignore unrecognized MIDI messages (e.g., MIDI Clock, Active Sensing, etc.)
      // These are typically system real-time messages that we don't need to process
      return
    }

    if (event.type !== "channel") {
      return
    }

    // Filter out program change messages - the software controls the instrument
    if (event.subtype === "programChange") {
      return
    }

    // Route MIDI input to the selected track's channel
    event.channel = this._channel

    this.player.sendEvent(event)
  }
}
