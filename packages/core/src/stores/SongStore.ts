import { makeObservable, observable } from "mobx"
import { emptySong } from "../entities"
import { mobxToObservable } from "../helpers/mobxToObservable"
import { Observable } from "../helpers/observable"

export class SongStore {
  song = emptySong()

  readonly onSongChanged: Observable

  constructor() {
    makeObservable(this, {
      song: observable.ref,
    })

    this.onSongChanged = mobxToObservable(this, "song")
  }

  serialize() {
    return this.song.serialize()
  }
}
