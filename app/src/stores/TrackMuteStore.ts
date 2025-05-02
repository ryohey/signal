import { makeObservable, observable } from "mobx"
import { TrackMute } from "../trackMute/TrackMute"

export class TrackMuteStore {
  trackMute: TrackMute = {
    mutes: {},
    solos: {},
  }

  constructor() {
    makeObservable(this, {
      trackMute: observable.ref,
    })
  }
}
