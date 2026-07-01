import { Emitter, Observable } from "@signal-app/observable"
import { emptySong } from "../entities"

export class SongStore {
  _song = emptySong()

  readonly onSongChanged: Observable
  private readonly _onSongChanged = new Emitter()

  constructor() {
    this.onSongChanged = this._onSongChanged
  }

  get song() {
    return this._song
  }

  set song(song) {
    if (this._song === song) {
      return
    }
    this._song = song
    this._onSongChanged.emit()
  }

  serialize() {
    return this.song.serialize()
  }
}
