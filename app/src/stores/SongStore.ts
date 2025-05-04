import { makeObservable, observable } from "mobx"
import { serialize } from "serializr"
import Song, { emptySong } from "../song"

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
