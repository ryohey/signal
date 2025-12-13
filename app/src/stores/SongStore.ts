import { emptySong, type Song } from "@signal-app/core"
import { makeObservable, observable } from "mobx"

export class SongStore {
  song: Song = emptySong()

  constructor() {
    makeObservable(this, {
      song: observable.ref,
    })
  }

  serialize() {
    return this.song.serialize()
  }
}
