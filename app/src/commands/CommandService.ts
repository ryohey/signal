import { SongStore } from "../stores/SongStore"
import { ArrangeCommandService } from "./arrange"
import { TrackCommandService } from "./track"

export class CommandService {
  readonly arrange: ArrangeCommandService
  readonly track: TrackCommandService

  constructor(private readonly songStore: SongStore) {
    this.arrange = new ArrangeCommandService(this.songStore)
    this.track = new TrackCommandService(this.songStore)
  }
}
