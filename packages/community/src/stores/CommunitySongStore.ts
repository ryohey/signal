import { CloudSong } from "@signal-app/api"
import { makeObservable, observable } from "mobx"

export class CommunitySongStore {
  songs: CloudSong[] = []

  constructor() {
    makeObservable(this, {
      songs: observable,
    })
  }
}
