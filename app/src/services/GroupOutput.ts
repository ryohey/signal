import type { TrackId } from "@signal-app/core"
import type { SendableEvent, SynthOutput } from "@signal-app/player"
import { makeObservable, observable } from "mobx"
import { METRONOME_TRACK_ID } from "../player/EventSource"
import { TrackMute } from "../trackMute/TrackMute"

export interface SynthEntry {
  synth: SynthOutput
  isEnabled: boolean
}

// Routing of MIDI events to multiple SynthOutputs and muting of tracks
export class GroupOutput implements SynthOutput {
  outputs: SynthEntry[] = []
  isMetronomeEnabled: boolean = false
  trackMute = TrackMute.empty

  constructor(private readonly metronomeOutput: SynthOutput) {
    makeObservable(this, {
      isMetronomeEnabled: observable,
    })
  }

  activate() {
    for (const o of this.outputs) {
      if (o.isEnabled) {
        o.synth.activate()
      }
    }
  }

  private getOutputs(trackId: TrackId | undefined): SynthOutput[] {
    if (trackId === METRONOME_TRACK_ID) {
      return this.isMetronomeEnabled ? [this.metronomeOutput] : []
    } else if (
      trackId !== undefined &&
      !TrackMute.shouldPlayTrack(trackId)(this.trackMute)
    ) {
      return []
    } else {
      return this.outputs.filter((o) => o.isEnabled).map((o) => o.synth)
    }
  }

  sendEvent(
    event: SendableEvent,
    delayTime: number,
    timestampNow: number,
    trackId?: TrackId
  ): void {
    for (const synth of this.getOutputs(trackId)) {
      synth.sendEvent(event, delayTime, timestampNow, trackId)
    }
  }
}
