import { Song, emptySong } from "@signal-app/core"
import { makeObservable, observable } from "mobx"
import { serialize } from "serializr"

export class SongStore {
  song: Song = emptySong()

  constructor() {
    makeObservable(this, {
      song: observable.ref,
    })
  }

  serialize() {
    return serialize(this.song)
  }
}
