import { TrackId } from "@signal-app/core"
import { SendableEvent, SynthOutput } from "@signal-app/player"
import { METRONOME_TRACK_ID } from "../player/EventSource"
import { TrackMute } from "../trackMute/TrackMute"

export interface SynthEntry {
  synth: SynthOutput
  isEnabled: boolean
}

// Routing of MIDI events to multiple SynthOutputs and muting of tracks
export class GroupOutput implements SynthOutput {
  outputs: SynthEntry[] = []
  trackMute = TrackMute.empty

  private _isMetronomeEnabled = false
  private isMetronomeEnabledListeners = new Set<() => void>()
  readonly onIsMetronomeEnabledChanged = {
    subscribe: (callback: () => void) => {
      this.isMetronomeEnabledListeners.add(callback)
      return () => {
        this.isMetronomeEnabledListeners.delete(callback)
      }
    },
  }

  constructor(private readonly metronomeOutput: SynthOutput) {}

  get isMetronomeEnabled() {
    return this._isMetronomeEnabled
  }

  setIsMetronomeEnabled(enabled: boolean) {
    if (this._isMetronomeEnabled !== enabled) {
      this._isMetronomeEnabled = enabled
      this.emitIsMetronomeEnabledChanged()
    }
  }

  activate() {
    this.outputs.filter((o) => o.isEnabled).forEach((o) => o.synth.activate())
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
    trackId?: TrackId,
  ): void {
    this.getOutputs(trackId).forEach((synth) =>
      synth.sendEvent(event, delayTime, timestampNow, trackId),
    )
  }

  private emitIsMetronomeEnabledChanged() {
    this.isMetronomeEnabledListeners.forEach((callback) => callback())
  }
}
