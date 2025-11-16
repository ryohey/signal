import { SongStore } from "../stores/SongStore"
import { ArrangeCommandService } from "./arrange"

export class CommandService {
  readonly arrange: ArrangeCommandService

  constructor(private readonly songStore: SongStore) {
    this.arrange = new ArrangeCommandService(this.songStore)
  }
}
