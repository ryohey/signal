import { isSetTempoEvent, Track } from "@signal-app/core"
import { Unsubscribe } from "@signal-app/observable"
import { TempoItem } from "./entities"
import { addTempoItem, updateTempoItems } from "./trackMutations/tempo"
import { getTempoItemById, getTempoItems } from "./trackQueries/tempo"

export class TrackTempoEditor {
  constructor(private readonly conductorTrack: Track) {}

  getItems = (): readonly TempoItem[] => getTempoItems(this.conductorTrack)

  getById = (id: number): TempoItem | undefined =>
    getTempoItemById(id)(this.conductorTrack)

  addItem = (item: Omit<TempoItem, "id">): TempoItem =>
    addTempoItem(item)(this.conductorTrack)

  removeItem = (id: number): void => {
    this.conductorTrack.removeEvent(id)
  }

  updateItem = (item: TempoItem): void =>
    updateTempoItems([item])(this.conductorTrack)

  observeItems = (listener: () => void): Unsubscribe =>
    this.conductorTrack.subscribeEventsChanged(isSetTempoEvent, listener)
}
