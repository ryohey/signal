import type { TrackEventOf, TrackEventStore } from "@signal-app/core"
import type { SetTempoEvent } from "midifile-ts"
import type { TempoItem } from "../entities"
import {
  setTempoEventToTempoItem,
  tempoItemToSetTempoEvent,
} from "../entities/tempo/transform"

export const addTempoItem =
  (item: Omit<TempoItem, "id">) =>
  (context: TrackEventStore): TempoItem => {
    const event = tempoItemToSetTempoEvent({ id: 0, ...item })
    const addedEvent = context.addEvent<TrackEventOf<SetTempoEvent>>(event)
    return setTempoEventToTempoItem(addedEvent)
  }

export const addTempoItems =
  (items: readonly Omit<TempoItem, "id">[]) =>
  (context: TrackEventStore): readonly TempoItem[] =>
    items.map((item) => addTempoItem(item)(context))

export const updateTempoItem =
  (item: TempoItem) => (context: TrackEventStore) => {
    context.updateEvent(item.id, tempoItemToSetTempoEvent(item))
  }

export const updateTempoItems =
  (items: readonly TempoItem[]) =>
  (context: TrackEventStore): void => {
    items.map((item) => updateTempoItem(item)(context))
  }
