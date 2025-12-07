import type { CloudSong, ICloudSongDataRepository } from "@signal-app/api"
import { read } from "midifile-ts"
import { computed, makeObservable, observable } from "mobx"
import { emptySong, Song } from "../song/Song.js"

export interface SongItem {
  song: Song
  metadata: CloudSong
}

export class SongStore {
  currentSong: SongItem | null = null
  isLoading: boolean = false

  constructor(private readonly songDataRepository: ICloudSongDataRepository) {
    makeObservable(this, {
      song: computed,
      currentSong: observable,
      isLoading: observable,
    })
  }

  get song(): Song {
    return this.currentSong?.song ?? emptySong()
  }

  async loadSong(cloudSong: CloudSong) {
    this.isLoading = true
    const songData = await this.songDataRepository.get(cloudSong.songDataId)
    const song = new Song(read(songData))
    this.currentSong = {
      song,
      metadata: cloudSong,
    }
    this.isLoading = false
  }
}
