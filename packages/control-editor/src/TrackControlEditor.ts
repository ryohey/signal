import { getAll, getEventById, Track, TrackEvent } from "@signal-app/core"
import { Unsubscribe } from "@signal-app/observable"
import { ControlEvent } from "./entities/ControlEvent"
import { ControlItem } from "./entities/ControlItem"
import { controlEventToItem } from "./entities/transform"
import { ValueEventType } from "./entities/ValueEventType"

export class TrackControlEditor {
  private readonly predicate: (e: TrackEvent) => e is ControlEvent
  private readonly factory: ReturnType<typeof ValueEventType.getEventFactory>

  constructor(
    private readonly track: Track,
    readonly type: ValueEventType,
  ) {
    const predicate = ValueEventType.getEventPredicate(type)
    this.predicate = (e): e is ControlEvent => predicate(e)
    this.factory = ValueEventType.getEventFactory(type)
  }

  getItems = (): readonly ControlItem[] =>
    this.track.getEvents().filter(this.predicate).map(controlEventToItem)

  getById = (id: number): ControlItem | undefined => {
    const event = this.track.getEventById(id)
    return event !== undefined && this.predicate(event)
      ? controlEventToItem(event)
      : undefined
  }

  addItem = (item: Omit<ControlItem, "id">): ControlItem => {
    const event = this.track.createOrUpdate<ControlEvent>({
      ...this.factory(item.value),
      tick: item.tick,
    })
    return controlEventToItem(event)
  }

  removeItem = (id: number): void => {
    this.track.removeEvent(id)
  }

  updateItem = (item: ControlItem): void => {
    this.track.updateEvent(item.id, item)
  }

  observeItems = (listener: () => void): Unsubscribe =>
    this.track.subscribeEventsChanged(this.predicate, listener)

  createPreviewEvent = (value: number) => this.factory(value)
}
