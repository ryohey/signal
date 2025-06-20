import { CloudSong } from "/imports/signal/packages/api/src"
import { makeObservable, observable } from "mobx"

export class CommunitySongStore {
  songs: CloudSong[] = []

  constructor() {
    makeObservable(this, {
      songs: observable,
    })
  }
}
