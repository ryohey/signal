import {
  ArrangeCommandService,
  createArrangeCommandService,
} from "./ArrangeCommandService"
import {
  ConductorTrackCommandService,
  createConductorTrackCommandService,
} from "./ConductorTrackCommandService"
import {
  ControlCommandService,
  createControlCommandService,
} from "./ControlCommandService"
import { ISongStore } from "./interfaces"
import {
  createSongCommandService,
  SongCommandService,
} from "./SongCommandService"
import {
  createTrackCommandService,
  TrackCommandService,
} from "./TrackCommandService"

export class CommandService {
  readonly song: SongCommandService
  readonly arrange: ArrangeCommandService
  readonly track: TrackCommandService
  readonly conductorTrack: ConductorTrackCommandService
  readonly control: ControlCommandService

  constructor(private readonly songStore: ISongStore) {
    this.song = createSongCommandService(this.songStore)
    this.arrange = createArrangeCommandService(this.songStore)
    this.track = createTrackCommandService(this.songStore)
    this.conductorTrack = createConductorTrackCommandService(this.songStore)
    this.control = createControlCommandService(this.songStore)
  }
}
