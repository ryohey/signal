import { Player } from "@signal-app/player"
import { deserializeSingleEvent, Stream } from "midifile-ts"
import { MIDIInputEvent } from "./MIDIInput"

export class MIDIMonitor {
  channel: number = 0

  constructor(private readonly player: Player) {}

  onMessage(e: MIDIInputEvent) {
    const stream = new Stream(e.data)
    const event = deserializeSingleEvent(stream)

    if (event.type !== "channel") {
      return
    }

    // modify channel to the selected track channel
    event.channel = this.channel

    this.player.sendEvent(event)
  }
}
