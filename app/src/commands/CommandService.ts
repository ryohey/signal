import { SongStore } from "../stores/SongStore"
import { ArrangeCommandService } from "./arrange"
import { ConductorTrackCommandService } from "./conductorTrack"
import { TrackCommandService } from "./track"

export class CommandService {
  readonly arrange: ArrangeCommandService
  readonly track: TrackCommandService
  readonly conductorTrack: ConductorTrackCommandService

  constructor(private readonly songStore: SongStore) {
    this.arrange = new ArrangeCommandService(this.songStore)
    this.track = new TrackCommandService(this.songStore)
    this.conductorTrack = new ConductorTrackCommandService(this.songStore)
  }
}
