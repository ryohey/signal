import { ArrangeCommandService } from "./ArrangeCommandService"
import { ConductorTrackCommandService } from "./ConductorTrackCommandService"
import { ControlCommandService } from "./ControlCommandService"
import { ISongStore } from "./interfaces"
import { TrackCommandService } from "./TrackCommandService"

export class CommandService {
  readonly arrange: ArrangeCommandService
  readonly track: TrackCommandService
  readonly conductorTrack: ConductorTrackCommandService
  readonly control: ControlCommandService

  constructor(private readonly songStore: ISongStore) {
    this.arrange = new ArrangeCommandService(this.songStore)
    this.track = new TrackCommandService(this.songStore)
    this.conductorTrack = new ConductorTrackCommandService(this.songStore)
    this.control = new ControlCommandService(this.songStore)
  }
}
