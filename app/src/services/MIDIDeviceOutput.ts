import type { SendableEvent, SynthOutput } from "@signal-app/player"
import { serialize } from "midifile-ts"

export default class MIDIDeviceOutput implements SynthOutput {
  readonly midiOutput: MIDIOutput

  constructor(midiOutput: MIDIOutput) {
    this.midiOutput = midiOutput
  }

  activate() {
    this.midiOutput.open()
  }

  sendEvent(
    event: SendableEvent,
    delayTime: number,
    timestampNow: number,
  ): void {
    const msg = serialize({ ...event, deltaTime: 0 }, false)
    const timestamp = delayTime * 1000 + timestampNow

    if (this.midiOutput.state === "connected") {
      try {
        this.midiOutput.send(msg, timestamp)
      } catch (e) {
        console.warn(e)
      }
    }
  }
}
