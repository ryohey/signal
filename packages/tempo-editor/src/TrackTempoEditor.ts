import { isSetTempoEvent, Track } from "@signal-app/core"
import { Unsubscribe } from "@signal-app/observable"
import { TempoItem } from "./entities"
import { addTempoItem, updateTempoItems } from "./trackMutations/tempo"
import { getTempoItemById, getTempoItems } from "./trackQueries/tempo"

export class TrackTempoEditor {
  constructor(private readonly conductorTrack: Track) {}

  getItems = (): readonly TempoItem[] =>
    this.conductorTrack.query(getTempoItems)

  getById = (id: number): TempoItem | undefined =>
    this.conductorTrack.query(getTempoItemById(id))

  addItem = (item: Omit<TempoItem, "id">): TempoItem =>
    this.conductorTrack.mutate(addTempoItem(item))

  removeItem = (id: number): void => {
    this.conductorTrack.removeEvent(id)
  }

  updateItem = (item: TempoItem): void =>
    this.conductorTrack.mutate(updateTempoItems([item]))

  observeItems = (listener: () => void): Unsubscribe =>
    this.conductorTrack.subscribeEventsChanged(isSetTempoEvent, listener)
}
