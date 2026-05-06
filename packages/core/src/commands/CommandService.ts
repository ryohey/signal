import { ArrangeCommandService } from "./ArrangeCommandService"
import { ConductorTrackCommandService } from "./ConductorTrackCommandService"
import { ControlCommandService } from "./ControlCommandService"
import { ISongStore } from "./interfaces"
import { SongCommandService } from "./SongCommandService"
import { TrackCommandService } from "./TrackCommandService"

export class CommandService {
  readonly song: SongCommandService
  readonly arrange: ArrangeCommandService
  readonly track: TrackCommandService
  readonly conductorTrack: ConductorTrackCommandService
  readonly control: ControlCommandService

  constructor(private readonly songStore: ISongStore) {
    this.song = new SongCommandService(this.songStore)
    this.arrange = new ArrangeCommandService(this.songStore)
    this.track = new TrackCommandService(this.songStore)
    this.conductorTrack = new ConductorTrackCommandService(this.songStore)
    this.control = new ControlCommandService(this.songStore)
  }
}
