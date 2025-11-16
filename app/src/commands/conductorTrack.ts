import { SongStore } from "../stores/SongStore"
import { TrackCommandService } from "./track"

export class ConductorTrackCommandService {
  private readonly trackCommands: TrackCommandService

  constructor(private readonly songStore: SongStore) {
    this.trackCommands = new TrackCommandService(songStore)
  }

  duplicateEvents = (eventIds: number[]) => {
    const conductorTrack = this.songStore.song.conductorTrack
    if (!conductorTrack) {
      return []
    }
    return this.trackCommands.duplicateEvents(conductorTrack.id, eventIds)
  }
}
