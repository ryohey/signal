import { MIDIDeviceStore, MIDIInputEvent } from "@signal-app/core"
import { Player } from "@signal-app/player"

export class MIDIMonitor {
  channel: number = 0

  constructor(
    private readonly player: Player,
    private readonly midiDeviceStore: MIDIDeviceStore,
  ) {}

  onMessage(e: MIDIInputEvent) {
    const event = e.message

    // Only allow channel and SysEx events
    if (
      event.type !== "channel" &&
      event.type !== "sysEx" &&
      event.type !== "dividedSysEx"
    ) {
      return
    }

    if (
      this.midiDeviceStore.midiInputRouting === "selectedTrack" &&
      event.type === "channel"
    ) {
      // modify channel to the selected track channel
      event.channel = this.channel
    }

    this.player.sendEvent(event)
  }
}
