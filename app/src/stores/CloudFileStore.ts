import {
  CloudSong,
  ICloudSongDataRepository,
  ICloudSongRepository,
} from "/imports/signal/packages/api/src"
import { orderBy } from "lodash"
import { computed, makeObservable, observable } from "mobx"
import { SongStore } from "./SongStore"

export class CloudFileStore {
  isLoading = false
  selectedColumn: "name" | "date" = "date"
  dateType: "created" | "updated" = "created"
  sortAscending = false
  _files: CloudSong[] = []

  constructor(
    private readonly songStore: SongStore,
    private readonly cloudSongRepository: ICloudSongRepository,
    private readonly cloudSongDataRepository: ICloudSongDataRepository
  ) {
    makeObservable(this, {
      isLoading: observable,
      selectedColumn: observable,
      dateType: observable,
      sortAscending: observable,
      _files: observable,
      files: computed,
    })
  }

  async load() {
    this.isLoading = true
    this._files = await this.cloudSongRepository.getMySongs()
    this.isLoading = false
  }

  get files() {
    return orderBy(
      this._files,
      (data) => {
        switch (this.selectedColumn) {
          case "name":
            return data.name
          case "date":
            switch (this.dateType) {
              case "created":
                return data.createdAt.getTime()
              case "updated":
                return data.updatedAt.getTime()
            }
        }
      },
      this.sortAscending ? "asc" : "desc"
    )
  }

  async deleteSong(song: CloudSong) {
    await this.cloudSongDataRepository.delete(song.songDataId)
    await this.cloudSongRepository.delete(song.id)

    if (this.songStore.song.cloudSongId === song.id) {
      this.songStore.song.cloudSongId = null
      this.songStore.song.cloudSongDataId = null
    }
    await this.load()
  }
}
